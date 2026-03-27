-- 移除 personal_course_actions 的 (course_id, action_id) 唯一約束
-- 因為同一課程可以包含多次相同動作（使用不同參數）
ALTER TABLE public.personal_course_actions 
DROP CONSTRAINT personal_course_actions_course_id_action_id_key;