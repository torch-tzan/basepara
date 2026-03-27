-- Add last_training column to students table
ALTER TABLE public.students 
ADD COLUMN last_training text NULL;