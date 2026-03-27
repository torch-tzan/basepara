-- Add trigger on profiles table to sync team assignment when a new profile is created
-- This handles the case when a student account is created (profile inserted)

CREATE OR REPLACE FUNCTION public.sync_profile_to_user_team_assignments()
RETURNS TRIGGER AS $$
DECLARE
  v_team_id text;
BEGIN
  -- Find if there's a student with matching email
  SELECT team_id INTO v_team_id
  FROM students
  WHERE email = NEW.email AND team_id IS NOT NULL;

  -- If a matching student with team_id exists, create the assignment
  IF v_team_id IS NOT NULL THEN
    INSERT INTO user_team_assignments (user_id, team_id)
    VALUES (NEW.user_id, v_team_id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table for new profile creation
DROP TRIGGER IF EXISTS sync_profile_team_trigger ON profiles;
CREATE TRIGGER sync_profile_team_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_user_team_assignments();