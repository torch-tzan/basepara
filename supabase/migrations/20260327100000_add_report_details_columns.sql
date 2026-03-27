-- Migration: Add report detail columns for report creation flow
-- Spec reference: 第五節 檢測報告 — 報告建立流程、列表與檢視

-- Add new columns to reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS coach_id TEXT REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS module_config JSONB,
  ADD COLUMN IF NOT EXISTS chart_data JSONB,
  ADD COLUMN IF NOT EXISTS markdown_notes TEXT,
  ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
  ADD COLUMN IF NOT EXISTS student_snapshot JSONB;

-- Add index on coach_id for query performance
CREATE INDEX IF NOT EXISTS idx_reports_coach ON public.reports(coach_id);

-- Comment on columns for documentation
COMMENT ON COLUMN public.reports.coach_id IS '生成教練 profile id';
COMMENT ON COLUMN public.reports.title IS '報告標題（可選）';
COMMENT ON COLUMN public.reports.module_config IS '模組設定：勾選的模組、排序、各模組篩選條件 (JSONB)';
COMMENT ON COLUMN public.reports.chart_data IS '各模組 query 出的資料快照 (JSONB)';
COMMENT ON COLUMN public.reports.markdown_notes IS 'Markdown 格式的文字備註';
COMMENT ON COLUMN public.reports.audio_file_url IS '原始錄音檔 URL（若有上傳）';
COMMENT ON COLUMN public.reports.student_snapshot IS '報告產生時的學員資料快照 (JSONB)';
