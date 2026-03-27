
-- Extend accounts SELECT policy so students can also see their responsible coaches (from student_coaches)

DROP POLICY IF EXISTS "Users can view accounts based on role" ON public.accounts;

CREATE POLICY "Users can view accounts based on role"
ON public.accounts
FOR SELECT
USING (
  has_full_access(auth.uid())
  OR (email = get_auth_email(auth.uid()))
  OR (id IN (
    SELECT at2.account_id
    FROM account_teams at2
    WHERE at2.team_id = ANY (get_user_team_ids(auth.uid()))
  ))
  OR (id IN (
    -- Students: team coaches (via students.team_id)
    SELECT at3.account_id
    FROM account_teams at3
    WHERE at3.team_id IN (
      SELECT s.team_id
      FROM students s
      WHERE s.email = get_auth_email(auth.uid())
    )
  ))
  OR (id IN (
    -- Students: responsible coaches (via student_coaches)
    SELECT sc.coach_id
    FROM student_coaches sc
    JOIN students s ON s.id = sc.student_id
    WHERE s.email = get_auth_email(auth.uid())
  ))
);
