-- Create enum for audit action types
CREATE TYPE public.audit_action_type AS ENUM (
  'account_created',
  'account_updated',
  'account_deleted',
  'account_activated',
  'account_deactivated',
  'role_changed',
  'password_reset_requested',
  'role_created',
  'role_updated',
  'role_deleted',
  'permission_changed',
  'team_created',
  'team_updated',
  'team_deleted',
  'student_created',
  'student_updated',
  'student_deleted',
  'course_created',
  'course_updated',
  'course_deleted',
  'login_success',
  'logout'
);

-- Create audit logs table
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  action_type audit_action_type NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_target_type ON public.audit_logs(target_type);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert audit logs (their own actions)
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Also fix the RLS policies that are causing "permission denied for table users" errors
-- by using security definer functions to access auth.users

-- Create a security definer function to get user email
CREATE OR REPLACE FUNCTION public.get_auth_email(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = _user_id
$$;

-- Update students RLS policy to use the security definer function
DROP POLICY IF EXISTS "Users can view students based on role" ON public.students;
CREATE POLICY "Users can view students based on role"
ON public.students
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR (team_id = ANY (get_user_team_ids(auth.uid())))
  OR (email = get_auth_email(auth.uid()))
);

-- Update schedule_events RLS policy to use the security definer function
DROP POLICY IF EXISTS "Users can view schedule_events based on role" ON public.schedule_events;
CREATE POLICY "Users can view schedule_events based on role"
ON public.schedule_events
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR (student_id IN (
    SELECT s.id FROM students s 
    WHERE s.team_id = ANY (get_user_team_ids(auth.uid()))
  ))
  OR (student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = get_auth_email(auth.uid())
  ))
);

-- Update reports RLS policy similarly
DROP POLICY IF EXISTS "Users can view reports based on role" ON public.reports;
CREATE POLICY "Users can view reports based on role"
ON public.reports
FOR SELECT
USING (
  has_full_access(auth.uid()) 
  OR (student_id IN (
    SELECT s.id FROM students s 
    WHERE s.team_id = ANY (get_user_team_ids(auth.uid()))
  ))
  OR (student_id IN (
    SELECT s.id FROM students s 
    WHERE s.email = get_auth_email(auth.uid())
  ))
);