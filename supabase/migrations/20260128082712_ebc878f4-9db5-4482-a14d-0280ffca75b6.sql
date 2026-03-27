-- Ensure all triggers are properly attached to tables

-- 1. Trigger on auth.users to create profile (should already exist via Supabase dashboard, but ensure the function is correct)
-- Note: This trigger should be set up in Supabase dashboard under Authentication > Hooks

-- 2. Trigger on profiles table - sync team when new profile is created
DROP TRIGGER IF EXISTS sync_profile_team_trigger ON profiles;
CREATE TRIGGER sync_profile_team_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_team_assignments();

-- 3. Trigger on students table - sync team when student is created or updated
DROP TRIGGER IF EXISTS sync_student_team_trigger ON students;
CREATE TRIGGER sync_student_team_trigger
  AFTER INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION sync_student_team_to_user_assignments();

-- 4. Triggers for account_teams <-> user_team_assignments bidirectional sync
DROP TRIGGER IF EXISTS sync_account_teams_trigger ON account_teams;
CREATE TRIGGER sync_account_teams_trigger
  AFTER INSERT OR UPDATE OR DELETE ON account_teams
  FOR EACH ROW
  EXECUTE FUNCTION sync_account_teams_to_user_teams();

DROP TRIGGER IF EXISTS sync_user_teams_trigger ON user_team_assignments;
CREATE TRIGGER sync_user_teams_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_teams_to_account_teams();

-- 5. Ensure handle_new_user trigger exists on auth.users
-- This creates the profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- Note: The trigger on auth.users needs to be created via Supabase dashboard
-- or using service role. Here we document it for reference:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION handle_new_user();