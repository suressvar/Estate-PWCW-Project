-- Migration: Worker Management, Attendance, Activity Logs, and Wage Register
-- Timestamp: 20260913160000

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'LEAVE'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE wage_paid_status AS ENUM (
    'UNPAID',
    'PAID',
    'PARTIAL'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create workers Table
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT,
  daily_wage_rate NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create worker_attendances Table
CREATE TABLE IF NOT EXISTS public.worker_attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'PRESENT',
  check_in_time TEXT,
  check_out_time TEXT,
  hours_worked NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_worker_attendance_date UNIQUE (worker_id, date)
);

-- 4. Create worker_activity_logs Table
CREATE TABLE IF NOT EXISTS public.worker_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  daily_log_id UUID NOT NULL REFERENCES public.daily_logs(id) ON DELETE CASCADE,
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
  activity_description TEXT NOT NULL,
  time_spent_hours NUMERIC(5, 2) NOT NULL DEFAULT 8.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create wage_entries Table
CREATE TABLE IF NOT EXISTS public.wage_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  computed_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_status wage_paid_status NOT NULL DEFAULT 'UNPAID',
  paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  paid_date DATE,
  crop_cycle_id UUID REFERENCES public.crop_cycles(id) ON DELETE SET NULL,
  payment_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wage_entry_worker_date UNIQUE (worker_id, date)
);

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_workers_active ON public.workers(active);
CREATE INDEX IF NOT EXISTS idx_worker_attendances_worker_date ON public.worker_attendances(worker_id, date);
CREATE INDEX IF NOT EXISTS idx_worker_attendances_date ON public.worker_attendances(date);
CREATE INDEX IF NOT EXISTS idx_worker_activity_logs_worker ON public.worker_activity_logs(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_activity_logs_daily_log ON public.worker_activity_logs(daily_log_id);
CREATE INDEX IF NOT EXISTS idx_worker_activity_logs_plot ON public.worker_activity_logs(plot_id);
CREATE INDEX IF NOT EXISTS idx_worker_activity_logs_crop_cycle ON public.worker_activity_logs(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_wage_entries_worker ON public.wage_entries(worker_id);
CREATE INDEX IF NOT EXISTS idx_wage_entries_date ON public.wage_entries(date);
CREATE INDEX IF NOT EXISTS idx_wage_entries_status ON public.wage_entries(paid_status);
CREATE INDEX IF NOT EXISTS idx_wage_entries_crop_cycle ON public.wage_entries(crop_cycle_id);

-- 7. Monthly Summary View
CREATE OR REPLACE VIEW public.v_worker_monthly_summary AS
SELECT
  w.id AS worker_id,
  w.name AS worker_name,
  w.role AS worker_role,
  w.daily_wage_rate,
  TO_CHAR(wa.date, 'YYYY-MM') AS month_key,
  COUNT(wa.id) AS total_attendance_days,
  COUNT(CASE WHEN wa.status = 'PRESENT' THEN 1 END) AS present_days,
  COUNT(CASE WHEN wa.status = 'HALF_DAY' THEN 1 END) AS half_days,
  COUNT(CASE WHEN wa.status = 'ABSENT' THEN 1 END) AS absent_days,
  COUNT(CASE WHEN wa.status = 'LEAVE' THEN 1 END) AS leave_days,
  ROUND(
    (COUNT(CASE WHEN wa.status = 'PRESENT' THEN 1 END)::NUMERIC + 
     0.5 * COUNT(CASE WHEN wa.status = 'HALF_DAY' THEN 1 END)::NUMERIC) / 
     NULLIF(COUNT(wa.id), 0) * 100, 1
  ) AS attendance_percent,
  COALESCE(SUM(wa.hours_worked), 0) AS total_hours_worked,
  COALESCE(SUM(we.computed_amount), 0) AS total_wages_earned,
  COALESCE(SUM(we.paid_amount), 0) AS total_wages_paid,
  COALESCE(SUM(we.computed_amount), 0) - COALESCE(SUM(we.paid_amount), 0) AS balance_due
FROM public.workers w
LEFT JOIN public.worker_attendances wa ON w.id = wa.worker_id
LEFT JOIN public.wage_entries we ON w.id = we.worker_id AND wa.date = we.date
GROUP BY w.id, w.name, w.role, w.daily_wage_rate, TO_CHAR(wa.date, 'YYYY-MM');

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wage_entries ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for Authenticated Users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workers' AND policyname = 'Allow authenticated users full access to workers') THEN
    CREATE POLICY "Allow authenticated users full access to workers" ON public.workers FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'worker_attendances' AND policyname = 'Allow authenticated users full access to worker_attendances') THEN
    CREATE POLICY "Allow authenticated users full access to worker_attendances" ON public.worker_attendances FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'worker_activity_logs' AND policyname = 'Allow authenticated users full access to worker_activity_logs') THEN
    CREATE POLICY "Allow authenticated users full access to worker_activity_logs" ON public.worker_activity_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wage_entries' AND policyname = 'Allow authenticated users full access to wage_entries') THEN
    CREATE POLICY "Allow authenticated users full access to wage_entries" ON public.wage_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
