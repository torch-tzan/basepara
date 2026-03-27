
-- Update the accounts RLS policy to allow students to see coaches of their team
-- Students need to see coach names for their profile page

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view accounts based on role" ON public.accounts;

-- Create updated policy that also checks student's team
CREATE POLICY "Users can view accounts based on role" 
ON public.accounts 
FOR SELECT 
USING (
  has_full_access(auth.uid()) 
  OR (email = get_auth_email(auth.uid())) 
  OR (id IN (
    SELECT at2.account_id 
    FROM account_teams at2 
    WHERE (at2.team_id = ANY (get_user_team_ids(auth.uid())))
  ))
  OR (id IN (
    -- Allow students to see coaches of their team
    SELECT at3.account_id 
    FROM account_teams at3 
    WHERE at3.team_id IN (
      SELECT s.team_id 
      FROM students s 
      WHERE s.email = get_auth_email(auth.uid())
    )
  ))
);
