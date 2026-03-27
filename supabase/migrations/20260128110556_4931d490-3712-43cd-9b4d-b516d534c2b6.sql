
-- 建立新的函數來檢查用戶對特定模組是否有全站資料存取權
-- 這個函數會先檢查 user_roles 表（admin/venue_coach 直接通過）
-- 然後再檢查 accounts 和 role_permissions 表

CREATE OR REPLACE FUNCTION public.has_module_full_site_access(_user_id uuid, _module permission_module)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- 方法1: 透過 user_roles 檢查 admin/venue_coach
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'venue_coach')
  ) OR EXISTS (
    -- 方法2: 透過 accounts -> roles -> role_permissions 檢查自訂角色
    SELECT 1
    FROM profiles p
    JOIN accounts a ON a.email = p.email
    JOIN role_permissions rp ON rp.role_id = a.role_id
    WHERE p.user_id = _user_id
      AND rp.module = _module
      AND rp.full_site = true
  )
$$;

-- 更新 students 表的 RLS 政策，讓具有 students 模組 full_site 權限的用戶可以看到所有學員
DROP POLICY IF EXISTS "Users can view students based on role" ON public.students;

CREATE POLICY "Users can view students based on role" ON public.students
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR has_module_full_site_access(auth.uid(), 'students'::permission_module)
  OR (team_id = ANY (get_user_team_ids(auth.uid())))
  OR (email = get_auth_email(auth.uid()))
);

-- 更新 teams 表的 RLS 政策
DROP POLICY IF EXISTS "Authenticated users can view teams" ON public.teams;

CREATE POLICY "Users can view teams based on role" ON public.teams
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR has_module_full_site_access(auth.uid(), 'teams'::permission_module)
  OR (id = ANY (get_user_team_ids(auth.uid())))
);

-- 更新 reports 表的 RLS 政策
DROP POLICY IF EXISTS "Users can view reports based on role" ON public.reports;

CREATE POLICY "Users can view reports based on role" ON public.reports
FOR SELECT
USING (
  has_full_access(auth.uid())
  OR has_module_full_site_access(auth.uid(), 'reports'::permission_module)
  OR (student_id IN (
    SELECT s.id FROM students s WHERE s.team_id = ANY (get_user_team_ids(auth.uid()))
  ))
  OR (student_id IN (
    SELECT s.id FROM students s WHERE s.email = get_auth_email(auth.uid())
  ))
);

-- 更新 schedule_events 表的 RLS 政策
DROP POLICY IF EXISTS "Users can view schedule_events based on role" ON public.schedule_events;

CREATE POLICY "Users can view schedule_events based on role" ON public.schedule_events
FOR SELECT
USING (
  has_full_access(auth.uid())
  OR has_module_full_site_access(auth.uid(), 'schedule'::permission_module)
  OR (student_id IN (
    SELECT s.id FROM students s WHERE s.team_id = ANY (get_user_team_ids(auth.uid()))
  ))
  OR (student_id IN (
    SELECT s.id FROM students s WHERE s.email = get_auth_email(auth.uid())
  ))
);
