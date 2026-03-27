-- Enable realtime for notifications table to support live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Enable realtime for course_comments table as well
ALTER PUBLICATION supabase_realtime ADD TABLE public.course_comments;