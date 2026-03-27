-- 新增打擊情境欄位到 training_actions 表
ALTER TABLE public.training_actions ADD COLUMN scenario text;