-- Create personal_courses table
CREATE TABLE public.personal_courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  color TEXT DEFAULT 'default',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create personal_course_actions table
CREATE TABLE public.personal_course_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT NOT NULL REFERENCES public.personal_courses(id) ON DELETE CASCADE,
  action_id TEXT NOT NULL REFERENCES public.training_actions(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, action_id)
);

-- Create personal_template_categories table
CREATE TABLE public.personal_template_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, owner_id)
);

-- Enable RLS on all tables
ALTER TABLE public.personal_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_course_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_template_categories ENABLE ROW LEVEL SECURITY;

-- Add course_type column to schedule_events
ALTER TABLE public.schedule_events ADD COLUMN course_type TEXT DEFAULT 'public' CHECK (course_type IN ('public', 'personal'));

-- Drop existing foreign key constraint on schedule_events.course_id
ALTER TABLE public.schedule_events DROP CONSTRAINT IF EXISTS schedule_events_course_id_fkey;

-- Create trigger function to validate course_id
CREATE OR REPLACE FUNCTION public.validate_schedule_event_course()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.course_type = 'public' THEN
    IF NOT EXISTS (SELECT 1 FROM training_courses WHERE id = NEW.course_id) THEN
      RAISE EXCEPTION 'Public course not found: %', NEW.course_id;
    END IF;
  ELSIF NEW.course_type = 'personal' THEN
    IF NOT EXISTS (SELECT 1 FROM personal_courses WHERE id = NEW.course_id) THEN
      RAISE EXCEPTION 'Personal course not found: %', NEW.course_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for validation
CREATE TRIGGER validate_schedule_event_course_trigger
  BEFORE INSERT OR UPDATE ON public.schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_schedule_event_course();

-- Create updated_at trigger for personal_courses
CREATE TRIGGER update_personal_courses_updated_at
  BEFORE UPDATE ON public.personal_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for personal_template_categories
CREATE TRIGGER update_personal_template_categories_updated_at
  BEFORE UPDATE ON public.personal_template_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for personal_courses
-- Owner can fully manage their own personal courses
CREATE POLICY "Users can manage own personal courses"
  ON public.personal_courses FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Users can view personal courses used in schedules they have access to
CREATE POLICY "Users can view personal courses in accessible schedules"
  ON public.personal_courses FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT se.course_id FROM schedule_events se
      JOIN students s ON se.student_id = s.id
      WHERE se.course_type = 'personal'
        AND (
          -- Admin/Venue coach access
          has_full_access(auth.uid())
          -- Team coach access
          OR s.team_id = ANY(get_user_team_ids(auth.uid()))
          -- Responsible coach access
          OR EXISTS (
            SELECT 1 FROM student_coaches sc
            JOIN accounts a ON sc.coach_id = a.id
            JOIN profiles p ON p.email = a.email
            WHERE sc.student_id = s.id AND p.user_id = auth.uid()
          )
          -- Student viewing own schedule
          OR s.email = get_auth_email(auth.uid())
        )
    )
  );

-- RLS Policies for personal_course_actions
-- Owner can manage personal course actions
CREATE POLICY "Users can manage personal course actions"
  ON public.personal_course_actions FOR ALL
  TO authenticated
  USING (
    course_id IN (
      SELECT id FROM personal_courses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    course_id IN (
      SELECT id FROM personal_courses WHERE owner_id = auth.uid()
    )
  );

-- Users can view personal course actions for accessible courses
CREATE POLICY "Users can view personal course actions for accessible courses"
  ON public.personal_course_actions FOR SELECT
  TO authenticated
  USING (
    course_id IN (
      SELECT id FROM personal_courses
    )
  );

-- RLS Policies for personal_template_categories
CREATE POLICY "Users can manage own personal template categories"
  ON public.personal_template_categories FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());