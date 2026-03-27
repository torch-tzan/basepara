-- =============================================
-- 1. 基礎資料表：角色與權限
-- =============================================

-- 角色類型 enum
CREATE TYPE public.user_role AS ENUM ('admin', 'venue_coach', 'team_coach', 'student');

-- 權限模組 enum
CREATE TYPE public.permission_module AS ENUM (
  'home', 'students', 'teams', 'schedule', 'reports', 
  'upload', 'comparison', 'templates', 'accounts'
);

-- 角色表
CREATE TABLE public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 角色權限表
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module public.permission_module NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  full_site BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, module)
);

-- =============================================
-- 2. 球隊管理
-- =============================================

CREATE TABLE public.teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 3. 帳號（教練/管理員）
-- =============================================

CREATE TABLE public.accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role_id TEXT NOT NULL REFERENCES public.roles(id),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 帳號與球隊的多對多關係
CREATE TABLE public.account_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, team_id)
);

-- =============================================
-- 4. 學員管理
-- =============================================

CREATE TABLE public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  team_id TEXT REFERENCES public.teams(id),
  position TEXT,
  height TEXT,
  weight TEXT,
  birthday TEXT,
  throwing_hand TEXT,
  batting_hand TEXT,
  last_test TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 學員與負責教練的多對多關係
CREATE TABLE public.student_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  coach_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, coach_id)
);

-- =============================================
-- 5. 訓練範本管理
-- =============================================

-- 動作分類 enum
CREATE TYPE public.action_category_type AS ENUM ('打擊', '投球', '非投打');

-- 訓練動作
CREATE TABLE public.training_actions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  action_category public.action_category_type NOT NULL,
  bat TEXT,
  equipment TEXT,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  intensity INTEGER DEFAULT 70,
  notes TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 訓練課程
CREATE TABLE public.training_courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  color TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 課程與動作的多對多關係（含順序）
CREATE TABLE public.course_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES public.training_actions(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, action_id)
);

-- 分類表（用於動態排序）
CREATE TABLE public.template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'course' or 'action'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, type)
);

-- =============================================
-- 6. 課表管理
-- =============================================

CREATE TABLE public.schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  course_id TEXT NOT NULL REFERENCES public.training_courses(id),
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  highlight BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_schedule_events_date ON public.schedule_events(date);
CREATE INDEX idx_schedule_events_student ON public.schedule_events(student_id);

-- =============================================
-- 7. 檢測報告
-- =============================================

CREATE TYPE public.report_type AS ENUM ('打擊', '投球', '體測');

CREATE TABLE public.reports (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  type public.report_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reports_student ON public.reports(student_id);
CREATE INDEX idx_reports_date ON public.reports(date);

-- =============================================
-- 8. 課程留言
-- =============================================

CREATE TABLE public.course_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL, -- 'student' or 'coach'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_comments_course ON public.course_comments(course_id);

-- =============================================
-- 9. 通知系統
-- =============================================

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'comment',
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  commenter_id TEXT NOT NULL,
  commenter_name TEXT NOT NULL,
  comment_preview TEXT,
  recipient_id TEXT NOT NULL, -- 接收通知的用戶 ID
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);

-- =============================================
-- 10. 啟用 RLS
-- =============================================

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 11. RLS 政策（暫時允許所有操作，待認證系統建立後調整）
-- =============================================

-- 角色表：所有人可讀
CREATE POLICY "Anyone can view roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Anyone can manage roles" ON public.roles FOR ALL USING (true);

-- 角色權限：所有人可讀
CREATE POLICY "Anyone can view role_permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage role_permissions" ON public.role_permissions FOR ALL USING (true);

-- 球隊：所有人可讀寫
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Anyone can manage teams" ON public.teams FOR ALL USING (true);

-- 帳號：所有人可讀寫
CREATE POLICY "Anyone can view accounts" ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Anyone can manage accounts" ON public.accounts FOR ALL USING (true);

-- 帳號球隊關聯：所有人可讀寫
CREATE POLICY "Anyone can view account_teams" ON public.account_teams FOR SELECT USING (true);
CREATE POLICY "Anyone can manage account_teams" ON public.account_teams FOR ALL USING (true);

-- 學員：所有人可讀寫
CREATE POLICY "Anyone can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Anyone can manage students" ON public.students FOR ALL USING (true);

-- 學員教練關聯：所有人可讀寫
CREATE POLICY "Anyone can view student_coaches" ON public.student_coaches FOR SELECT USING (true);
CREATE POLICY "Anyone can manage student_coaches" ON public.student_coaches FOR ALL USING (true);

-- 訓練動作：所有人可讀寫
CREATE POLICY "Anyone can view training_actions" ON public.training_actions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage training_actions" ON public.training_actions FOR ALL USING (true);

-- 訓練課程：所有人可讀寫
CREATE POLICY "Anyone can view training_courses" ON public.training_courses FOR SELECT USING (true);
CREATE POLICY "Anyone can manage training_courses" ON public.training_courses FOR ALL USING (true);

-- 課程動作關聯：所有人可讀寫
CREATE POLICY "Anyone can view course_actions" ON public.course_actions FOR SELECT USING (true);
CREATE POLICY "Anyone can manage course_actions" ON public.course_actions FOR ALL USING (true);

-- 範本分類：所有人可讀寫
CREATE POLICY "Anyone can view template_categories" ON public.template_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage template_categories" ON public.template_categories FOR ALL USING (true);

-- 課表事件：所有人可讀寫
CREATE POLICY "Anyone can view schedule_events" ON public.schedule_events FOR SELECT USING (true);
CREATE POLICY "Anyone can manage schedule_events" ON public.schedule_events FOR ALL USING (true);

-- 報告：所有人可讀寫
CREATE POLICY "Anyone can view reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Anyone can manage reports" ON public.reports FOR ALL USING (true);

-- 課程留言：所有人可讀寫
CREATE POLICY "Anyone can view course_comments" ON public.course_comments FOR SELECT USING (true);
CREATE POLICY "Anyone can manage course_comments" ON public.course_comments FOR ALL USING (true);

-- 通知：所有人可讀寫
CREATE POLICY "Anyone can view notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can manage notifications" ON public.notifications FOR ALL USING (true);

-- =============================================
-- 12. 更新時間戳觸發器
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_actions_updated_at BEFORE UPDATE ON public.training_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_courses_updated_at BEFORE UPDATE ON public.training_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_template_categories_updated_at BEFORE UPDATE ON public.template_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_events_updated_at BEFORE UPDATE ON public.schedule_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_comments_updated_at BEFORE UPDATE ON public.course_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();