-- Fix accounts table RLS policy - restrict access based on role
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view accounts" ON public.accounts;

-- Create a new policy that restricts access:
-- 1. Admins can see all accounts
-- 2. Venue coaches can see all accounts (needed for team management)
-- 3. Team coaches can see accounts that are coaches of their assigned teams
-- 4. Users can see their own account by matching email
CREATE POLICY "Users can view accounts based on role" 
ON public.accounts 
FOR SELECT 
USING (
  has_full_access(auth.uid()) 
  OR email = get_auth_email(auth.uid())
  OR id IN (
    -- Team coaches can see other coaches assigned to their teams
    SELECT at2.account_id 
    FROM account_teams at2
    WHERE at2.team_id = ANY(get_user_team_ids(auth.uid()))
  )
);