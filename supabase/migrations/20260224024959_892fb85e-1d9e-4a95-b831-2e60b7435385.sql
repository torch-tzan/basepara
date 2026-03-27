
-- 1. Create student_team_history table
CREATE TABLE public.student_team_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  team_id text NOT NULL REFERENCES public.teams(id),
  is_current boolean NOT NULL DEFAULT true,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_team_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins and venue coaches can manage student_team_history"
  ON public.student_team_history FOR ALL
  USING (has_full_access(auth.uid()));

CREATE POLICY "Users can view student_team_history based on role"
  ON public.student_team_history FOR SELECT
  USING (
    has_full_access(auth.uid())
    OR has_module_full_site_access(auth.uid(), 'students'::permission_module)
    OR student_id IN (
      SELECT id FROM students WHERE team_id = ANY(get_user_team_ids(auth.uid()))
    )
    OR student_id IN (
      SELECT id FROM students WHERE email = get_auth_email(auth.uid()))
  );

-- Updated_at trigger
CREATE TRIGGER update_student_team_history_updated_at
  BEFORE UPDATE ON public.student_team_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add team_history_id to student_coaches
ALTER TABLE public.student_coaches
  ADD COLUMN team_history_id uuid REFERENCES public.student_team_history(id) ON DELETE CASCADE;

-- 3. Migrate existing data: create team_history records from students.team_id
INSERT INTO public.student_team_history (student_id, team_id, is_current)
SELECT id, team_id, true FROM public.students WHERE team_id IS NOT NULL;

-- 4. Link existing student_coaches to the new team_history records
UPDATE public.student_coaches sc
SET team_history_id = sth.id
FROM public.student_team_history sth
WHERE sc.student_id = sth.student_id AND sth.is_current = true;
