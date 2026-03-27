-- Fix security warnings: update_updated_at_column function search_path
-- and make INSERT policies more specific

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. Fix INSERT policies to be more specific
-- Course comments: require user_id to match
DROP POLICY IF EXISTS "Authenticated users can create course_comments" ON public.course_comments;
CREATE POLICY "Users can create comments with their own user_id"
  ON public.course_comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Notifications: require commenter_id to match
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications as themselves"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (commenter_id = auth.uid()::text);