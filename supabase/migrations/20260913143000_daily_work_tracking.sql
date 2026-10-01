-- Migration: Daily Work Tracking Module
-- Timestamp: 20260913143000

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE daily_log_status AS ENUM (
    'PLANNED',
    'IN_PROGRESS',
    'COMPLETED',
    'NOT_DONE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'SOWING',
    'WEEDING',
    'IRRIGATION',
    'SPRAYING',
    'HARVESTING',
    'FERTILIZER_APPLICATION',
    'LAND_PREPARATION',
    'PRUNING',
    'MAINTENANCE',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create daily_logs Table
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  status daily_log_status NOT NULL DEFAULT 'PLANNED',
  created_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_logs_plot_id_date_key UNIQUE (plot_id, date)
);

-- 3. Create work_activities Table
CREATE TABLE IF NOT EXISTS public.work_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL DEFAULT 'OTHER',
  custom_activity TEXT,
  description TEXT NOT NULL,
  planned_flag BOOLEAN NOT NULL DEFAULT TRUE,
  completed_flag BOOLEAN NOT NULL DEFAULT FALSE,
  reason_if_not_done TEXT,
  carried_forward_from_id UUID REFERENCES public.work_activities(id) ON DELETE SET NULL,
  assigned_worker_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_plot ON public.daily_logs(plot_id);
CREATE INDEX IF NOT EXISTS idx_work_activities_daily_log ON public.work_activities(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_work_activities_carried_forward ON public.work_activities(carried_forward_from_id);

-- 5. Enable Row-Level Security
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_activities ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Authenticated users can select daily_logs"
  ON public.daily_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert daily_logs"
  ON public.daily_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update daily_logs"
  ON public.daily_logs FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete daily_logs"
  ON public.daily_logs FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can select work_activities"
  ON public.work_activities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work_activities"
  ON public.work_activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_activities"
  ON public.work_activities FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete work_activities"
  ON public.work_activities FOR DELETE
  TO authenticated
  USING (true);
