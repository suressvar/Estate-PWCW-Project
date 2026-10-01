-- Migration: Seed-to-Harvest Financial Ledger per Plot and CropCycle
-- Timestamp: 20260913150000

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE crop_cycle_status AS ENUM (
    'SOWN',
    'GROWING',
    'HARVESTED',
    'SOLD',
    'CLOSED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crop_expense_category AS ENUM (
    'SEEDS',
    'FERTILIZER',
    'PESTICIDE',
    'LABOR',
    'MACHINERY',
    'IRRIGATION',
    'TRANSPORT',
    'MISC'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crop_income_source AS ENUM (
    'MARKET_SALE',
    'DIRECT_BUYER',
    'GOVERNMENT_SCHEME',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create crop_cycles Table
CREATE TABLE IF NOT EXISTS public.crop_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plot_id UUID NOT NULL REFERENCES public.plots(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  crop_type TEXT,
  sowing_date DATE NOT NULL,
  expected_harvest_date DATE NOT NULL,
  actual_harvest_date DATE,
  status crop_cycle_status NOT NULL DEFAULT 'SOWN',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create crop_expenses Table
CREATE TABLE IF NOT EXISTS public.crop_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_cycle_id UUID NOT NULL REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  category crop_expense_category NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  linked_daily_log_id UUID REFERENCES public.daily_logs(id) ON DELETE SET NULL,
  source_ref_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create crop_incomes Table
CREATE TABLE IF NOT EXISTS public.crop_incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_cycle_id UUID NOT NULL REFERENCES public.crop_cycles(id) ON DELETE CASCADE,
  source crop_income_source NOT NULL,
  quantity_sold NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  rate_per_unit NUMERIC(10, 2) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  date DATE NOT NULL,
  buyer_name TEXT,
  invoice_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_crop_cycles_plot ON public.crop_cycles(plot_id);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_status ON public.crop_cycles(status);
CREATE INDEX IF NOT EXISTS idx_crop_cycles_dates ON public.crop_cycles(sowing_date, actual_harvest_date);
CREATE INDEX IF NOT EXISTS idx_crop_expenses_cycle ON public.crop_expenses(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_crop_expenses_category ON public.crop_expenses(category);
CREATE INDEX IF NOT EXISTS idx_crop_expenses_date ON public.crop_expenses(date);
CREATE INDEX IF NOT EXISTS idx_crop_expenses_source_ref ON public.crop_expenses(source_ref_id);
CREATE INDEX IF NOT EXISTS idx_crop_incomes_cycle ON public.crop_incomes(crop_cycle_id);
CREATE INDEX IF NOT EXISTS idx_crop_incomes_date ON public.crop_incomes(date);

-- 6. Computed Derived Views for Financial Rollups
CREATE OR REPLACE VIEW public.v_crop_cycle_financials AS
SELECT
  cc.id AS crop_cycle_id,
  cc.plot_id,
  cc.crop_name,
  cc.crop_type,
  cc.sowing_date,
  cc.expected_harvest_date,
  cc.actual_harvest_date,
  cc.status,
  COALESCE(e.total_expenses, 0) AS total_expenses,
  COALESCE(i.total_income, 0) AS total_income,
  (COALESCE(i.total_income, 0) - COALESCE(e.total_expenses, 0)) AS net_profit_loss,
  CASE
    WHEN COALESCE(e.total_expenses, 0) > 0 THEN
      ROUND(((COALESCE(i.total_income, 0) - COALESCE(e.total_expenses, 0)) / e.total_expenses) * 100, 2)
    ELSE 0
  END AS roi_percentage
FROM public.crop_cycles cc
LEFT JOIN (
  SELECT crop_cycle_id, SUM(amount) AS total_expenses
  FROM public.crop_expenses
  GROUP BY crop_cycle_id
) e ON cc.id = e.crop_cycle_id
LEFT JOIN (
  SELECT crop_cycle_id, SUM(amount) AS total_income
  FROM public.crop_incomes
  GROUP BY crop_cycle_id
) i ON cc.id = i.crop_cycle_id;

CREATE OR REPLACE VIEW public.v_plot_lifetime_financials AS
SELECT
  p.id AS plot_id,
  p.name AS plot_name,
  p.area_acres,
  COUNT(cc.id) AS total_crop_cycles,
  COALESCE(SUM(vcc.total_expenses), 0) AS lifetime_expenses,
  COALESCE(SUM(vcc.total_income), 0) AS lifetime_income,
  COALESCE(SUM(vcc.net_profit_loss), 0) AS lifetime_profit_loss
FROM public.plots p
LEFT JOIN public.crop_cycles cc ON p.id = cc.plot_id
LEFT JOIN public.v_crop_cycle_financials vcc ON cc.id = vcc.crop_cycle_id
GROUP BY p.id, p.name, p.area_acres;

-- 7. Enable Row-Level Security
ALTER TABLE public.crop_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_incomes ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY "Authenticated users can select crop_cycles"
  ON public.crop_cycles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert crop_cycles"
  ON public.crop_cycles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update crop_cycles"
  ON public.crop_cycles FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete crop_cycles"
  ON public.crop_cycles FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can select crop_expenses"
  ON public.crop_expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert crop_expenses"
  ON public.crop_expenses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update crop_expenses"
  ON public.crop_expenses FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete crop_expenses"
  ON public.crop_expenses FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can select crop_incomes"
  ON public.crop_incomes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert crop_incomes"
  ON public.crop_incomes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update crop_incomes"
  ON public.crop_incomes FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete crop_incomes"
  ON public.crop_incomes FOR DELETE
  TO authenticated
  USING (true);
