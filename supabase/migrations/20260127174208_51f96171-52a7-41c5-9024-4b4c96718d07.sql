
-- 建立從 account_teams 同步到 user_team_assignments 的函數
CREATE OR REPLACE FUNCTION public.sync_account_teams_to_user_teams()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 找到對應的 user_id
    SELECT p.user_id INTO v_user_id
    FROM accounts a
    JOIN profiles p ON p.email = a.email
    WHERE a.id = NEW.account_id;
    
    IF v_user_id IS NOT NULL THEN
      INSERT INTO user_team_assignments (user_id, team_id)
      VALUES (v_user_id, NEW.team_id)
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- 找到對應的 user_id
    SELECT p.user_id INTO v_user_id
    FROM accounts a
    JOIN profiles p ON p.email = a.email
    WHERE a.id = NEW.account_id;
    
    IF v_user_id IS NOT NULL THEN
      -- 刪除舊的分配
      DELETE FROM user_team_assignments 
      WHERE user_id = v_user_id AND team_id = OLD.team_id;
      
      -- 新增新的分配
      INSERT INTO user_team_assignments (user_id, team_id)
      VALUES (v_user_id, NEW.team_id)
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- 找到對應的 user_id
    SELECT p.user_id INTO v_user_id
    FROM accounts a
    JOIN profiles p ON p.email = a.email
    WHERE a.id = OLD.account_id;
    
    IF v_user_id IS NOT NULL THEN
      DELETE FROM user_team_assignments 
      WHERE user_id = v_user_id AND team_id = OLD.team_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 建立從 user_team_assignments 同步到 account_teams 的函數
CREATE OR REPLACE FUNCTION public.sync_user_teams_to_account_teams()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 找到對應的 account_id
    SELECT a.id INTO v_account_id
    FROM profiles p
    JOIN accounts a ON a.email = p.email
    WHERE p.user_id = NEW.user_id;
    
    IF v_account_id IS NOT NULL THEN
      INSERT INTO account_teams (account_id, team_id)
      VALUES (v_account_id, NEW.team_id)
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- 找到對應的 account_id
    SELECT a.id INTO v_account_id
    FROM profiles p
    JOIN accounts a ON a.email = p.email
    WHERE p.user_id = NEW.user_id;
    
    IF v_account_id IS NOT NULL THEN
      -- 刪除舊的分配
      DELETE FROM account_teams 
      WHERE account_id = v_account_id AND team_id = OLD.team_id;
      
      -- 新增新的分配
      INSERT INTO account_teams (account_id, team_id)
      VALUES (v_account_id, NEW.team_id)
      ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- 找到對應的 account_id
    SELECT a.id INTO v_account_id
    FROM profiles p
    JOIN accounts a ON a.email = p.email
    WHERE p.user_id = OLD.user_id;
    
    IF v_account_id IS NOT NULL THEN
      DELETE FROM account_teams 
      WHERE account_id = v_account_id AND team_id = OLD.team_id;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- 建立觸發器：account_teams 變更時同步到 user_team_assignments
CREATE TRIGGER sync_account_teams_trigger
AFTER INSERT OR UPDATE OR DELETE ON account_teams
FOR EACH ROW
EXECUTE FUNCTION sync_account_teams_to_user_teams();

-- 建立觸發器：user_team_assignments 變更時同步到 account_teams
CREATE TRIGGER sync_user_teams_trigger
AFTER INSERT OR UPDATE OR DELETE ON user_team_assignments
FOR EACH ROW
EXECUTE FUNCTION sync_user_teams_to_account_teams();

-- 為 account_teams 新增唯一約束（防止重複）
ALTER TABLE account_teams ADD CONSTRAINT account_teams_unique UNIQUE (account_id, team_id);

-- 為 user_team_assignments 新增唯一約束（防止重複）
ALTER TABLE user_team_assignments ADD CONSTRAINT user_team_assignments_unique UNIQUE (user_id, team_id);
