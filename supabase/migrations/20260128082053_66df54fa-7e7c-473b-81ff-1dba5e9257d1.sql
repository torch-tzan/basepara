
-- Create function to sync student's team_id to user_team_assignments
CREATE OR REPLACE FUNCTION public.sync_student_team_to_user_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Find user_id from profiles by matching email
  SELECT p.user_id INTO v_user_id
  FROM profiles p
  WHERE p.email = NEW.email;

  IF v_user_id IS NULL THEN
    -- No user found for this student email, skip
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Insert team assignment for new student
    IF NEW.team_id IS NOT NULL THEN
      INSERT INTO user_team_assignments (user_id, team_id)
      VALUES (v_user_id, NEW.team_id)
      ON CONFLICT DO NOTHING;
    END IF;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle team_id change
    IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN
      -- Remove old assignment if existed
      IF OLD.team_id IS NOT NULL THEN
        DELETE FROM user_team_assignments 
        WHERE user_id = v_user_id AND team_id = OLD.team_id;
      END IF;
      
      -- Add new assignment
      IF NEW.team_id IS NOT NULL THEN
        INSERT INTO user_team_assignments (user_id, team_id)
        VALUES (v_user_id, NEW.team_id)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    
    -- Handle email change (user might have changed)
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      DECLARE
        v_old_user_id uuid;
      BEGIN
        SELECT p.user_id INTO v_old_user_id
        FROM profiles p
        WHERE p.email = OLD.email;
        
        IF v_old_user_id IS NOT NULL AND OLD.team_id IS NOT NULL THEN
          DELETE FROM user_team_assignments 
          WHERE user_id = v_old_user_id AND team_id = OLD.team_id;
        END IF;
        
        IF v_user_id IS NOT NULL AND NEW.team_id IS NOT NULL THEN
          INSERT INTO user_team_assignments (user_id, team_id)
          VALUES (v_user_id, NEW.team_id)
          ON CONFLICT DO NOTHING;
        END IF;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on students table
DROP TRIGGER IF EXISTS sync_student_team_trigger ON students;
CREATE TRIGGER sync_student_team_trigger
AFTER INSERT OR UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION sync_student_team_to_user_assignments();

-- Sync existing students to user_team_assignments
INSERT INTO user_team_assignments (user_id, team_id)
SELECT p.user_id, s.team_id
FROM students s
JOIN profiles p ON p.email = s.email
WHERE s.team_id IS NOT NULL
ON CONFLICT DO NOTHING;
