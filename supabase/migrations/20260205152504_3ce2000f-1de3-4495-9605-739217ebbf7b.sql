-- Add custom sets, reps, intensity columns to course_actions
ALTER TABLE public.course_actions 
ADD COLUMN IF NOT EXISTS sets integer,
ADD COLUMN IF NOT EXISTS reps integer,
ADD COLUMN IF NOT EXISTS intensity integer;

-- Add custom sets, reps, intensity columns to personal_course_actions
ALTER TABLE public.personal_course_actions 
ADD COLUMN IF NOT EXISTS sets integer,
ADD COLUMN IF NOT EXISTS reps integer,
ADD COLUMN IF NOT EXISTS intensity integer;

-- Add comments for documentation
COMMENT ON COLUMN public.course_actions.sets IS 'Custom sets override for this course action (null = use template default)';
COMMENT ON COLUMN public.course_actions.reps IS 'Custom reps override for this course action (null = use template default)';
COMMENT ON COLUMN public.course_actions.intensity IS 'Custom intensity override for this course action (null = use template default)';

COMMENT ON COLUMN public.personal_course_actions.sets IS 'Custom sets override for this course action (null = use template default)';
COMMENT ON COLUMN public.personal_course_actions.reps IS 'Custom reps override for this course action (null = use template default)';
COMMENT ON COLUMN public.personal_course_actions.intensity IS 'Custom intensity override for this course action (null = use template default)';