-- 1. Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'venue_coach', 'team_coach', 'student');

-- 2. Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 4. Create mapping table for coach-team assignments (for authenticated users)
CREATE TABLE public.user_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id TEXT REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_id)
);

-- 5. Enable RLS on new tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_team_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 8. Create function to check if user is admin or venue_coach (full access)
CREATE OR REPLACE FUNCTION public.has_full_access(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'venue_coach')
  )
$$;

-- 9. Create function to get user's assigned team IDs
CREATE OR REPLACE FUNCTION public.get_user_team_ids(_user_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(team_id), ARRAY[]::TEXT[])
  FROM public.user_team_assignments
  WHERE user_id = _user_id
$$;

-- 10. RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. RLS Policies for user_roles
CREATE POLICY "Users can view own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. RLS Policies for user_team_assignments
CREATE POLICY "Users can view own team assignments"
  ON public.user_team_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all team assignments"
  ON public.user_team_assignments FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage team assignments"
  ON public.user_team_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 13. Update existing tables RLS to use authentication
-- Drop old permissive policies and create proper ones

-- Teams table
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can manage teams" ON public.teams;

CREATE POLICY "Authenticated users can view teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and venue coaches can manage teams"
  ON public.teams FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Students table
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
DROP POLICY IF EXISTS "Anyone can manage students" ON public.students;

CREATE POLICY "Users can view students based on role"
  ON public.students FOR SELECT
  TO authenticated
  USING (
    public.has_full_access(auth.uid()) 
    OR team_id = ANY(public.get_user_team_ids(auth.uid()))
  );

CREATE POLICY "Admins and venue coaches can manage students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Accounts table
DROP POLICY IF EXISTS "Anyone can view accounts" ON public.accounts;
DROP POLICY IF EXISTS "Anyone can manage accounts" ON public.accounts;

CREATE POLICY "Authenticated users can view accounts"
  ON public.accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage accounts"
  ON public.accounts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Roles table
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Anyone can manage roles" ON public.roles;

CREATE POLICY "Authenticated users can view roles"
  ON public.roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage roles"
  ON public.roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Role permissions table
DROP POLICY IF EXISTS "Anyone can view role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Anyone can manage role_permissions" ON public.role_permissions;

CREATE POLICY "Authenticated users can view role_permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage role_permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Training courses table
DROP POLICY IF EXISTS "Anyone can view training_courses" ON public.training_courses;
DROP POLICY IF EXISTS "Anyone can manage training_courses" ON public.training_courses;

CREATE POLICY "Authenticated users can view training_courses"
  ON public.training_courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and venue coaches can manage training_courses"
  ON public.training_courses FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Training actions table
DROP POLICY IF EXISTS "Anyone can view training_actions" ON public.training_actions;
DROP POLICY IF EXISTS "Anyone can manage training_actions" ON public.training_actions;

CREATE POLICY "Authenticated users can view training_actions"
  ON public.training_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and venue coaches can manage training_actions"
  ON public.training_actions FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Course actions table
DROP POLICY IF EXISTS "Anyone can view course_actions" ON public.course_actions;
DROP POLICY IF EXISTS "Anyone can manage course_actions" ON public.course_actions;

CREATE POLICY "Authenticated users can view course_actions"
  ON public.course_actions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and venue coaches can manage course_actions"
  ON public.course_actions FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Template categories table
DROP POLICY IF EXISTS "Anyone can view template_categories" ON public.template_categories;
DROP POLICY IF EXISTS "Anyone can manage template_categories" ON public.template_categories;

CREATE POLICY "Authenticated users can view template_categories"
  ON public.template_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and venue coaches can manage template_categories"
  ON public.template_categories FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Reports table
DROP POLICY IF EXISTS "Anyone can view reports" ON public.reports;
DROP POLICY IF EXISTS "Anyone can manage reports" ON public.reports;

CREATE POLICY "Users can view reports based on role"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    public.has_full_access(auth.uid())
    OR student_id IN (
      SELECT id FROM public.students 
      WHERE team_id = ANY(public.get_user_team_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins and venue coaches can manage reports"
  ON public.reports FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Schedule events table
DROP POLICY IF EXISTS "Anyone can view schedule_events" ON public.schedule_events;
DROP POLICY IF EXISTS "Anyone can manage schedule_events" ON public.schedule_events;

CREATE POLICY "Users can view schedule_events based on role"
  ON public.schedule_events FOR SELECT
  TO authenticated
  USING (
    public.has_full_access(auth.uid())
    OR student_id IN (
      SELECT id FROM public.students 
      WHERE team_id = ANY(public.get_user_team_ids(auth.uid()))
    )
  );

CREATE POLICY "Admins and venue coaches can manage schedule_events"
  ON public.schedule_events FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Account teams table
DROP POLICY IF EXISTS "Anyone can view account_teams" ON public.account_teams;
DROP POLICY IF EXISTS "Anyone can manage account_teams" ON public.account_teams;

CREATE POLICY "Authenticated users can view account_teams"
  ON public.account_teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage account_teams"
  ON public.account_teams FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Student coaches table
DROP POLICY IF EXISTS "Anyone can view student_coaches" ON public.student_coaches;
DROP POLICY IF EXISTS "Anyone can manage student_coaches" ON public.student_coaches;

CREATE POLICY "Authenticated users can view student_coaches"
  ON public.student_coaches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and venue coaches can manage student_coaches"
  ON public.student_coaches FOR ALL
  TO authenticated
  USING (public.has_full_access(auth.uid()));

-- Course comments table
DROP POLICY IF EXISTS "Anyone can view course_comments" ON public.course_comments;
DROP POLICY IF EXISTS "Anyone can manage course_comments" ON public.course_comments;

CREATE POLICY "Authenticated users can view course_comments"
  ON public.course_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create course_comments"
  ON public.course_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own comments"
  ON public.course_comments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own comments or admins"
  ON public.course_comments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text OR public.has_role(auth.uid(), 'admin'));

-- Notifications table
DROP POLICY IF EXISTS "Anyone can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Anyone can manage notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid()::text);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid()::text);

-- 14. Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 15. Add trigger for updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();