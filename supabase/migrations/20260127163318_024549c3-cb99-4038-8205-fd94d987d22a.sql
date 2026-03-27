-- Drop existing SELECT policy for students
DROP POLICY IF EXISTS "Users can view students based on role" ON public.students;

-- Create new policy that also allows students to view their own record (matching by email)
CREATE POLICY "Users can view students based on role"
ON public.students
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR (team_id = ANY (get_user_team_ids(auth.uid())))
  OR (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

-- Drop existing SELECT policy for schedule_events
DROP POLICY IF EXISTS "Users can view schedule_events based on role" ON public.schedule_events;

-- Create new policy that also allows students to view their own schedule
CREATE POLICY "Users can view schedule_events based on role"
ON public.schedule_events
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR (student_id IN (
    SELECT s.id FROM students s 
    WHERE s.team_id = ANY (get_user_team_ids(auth.uid()))
  ))
  OR (student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);