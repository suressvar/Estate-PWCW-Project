-- ==========================================================
-- Migration: Machinery & Vehicle Register, Per-Use Logging,
-- General & Petty Cash Expense Tracker, and Final Consolidated Views
-- ==========================================================

-- 1. Create Enums
DO $$ BEGIN
    CREATE TYPE machine_type AS ENUM (
        'TRACTOR',
        'TILLER',
        'SPRAYER',
        'PUMP',
        'HARVESTER',
        'VEHICLE',
        'DRONE',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM (
        'GENERAL',
        'PETTY_CASH',
        'MAINTENANCE',
        'ADMIN',
        'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create machines Table
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type machine_type NOT NULL DEFAULT 'TRACTOR',
    registration_number VARCHAR(100),
    fuel_type VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create machine_usage_logs Table
CREATE TABLE IF NOT EXISTS machine_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    plot_id UUID REFERENCES plots(id) ON DELETE SET NULL,
    daily_log_id UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
    worker_id UUID REFERENCES workers(id) ON DELETE SET NULL,
    operator_name VARCHAR(255),
    start_time VARCHAR(20),
    end_time VARCHAR(20),
    hours_used NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
    work_description TEXT NOT NULL,
    fuel_cost NUMERIC(10, 2),
    maintenance_cost NUMERIC(10, 2),
    crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category expense_category NOT NULL DEFAULT 'GENERAL',
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    plot_id UUID REFERENCES plots(id) ON DELETE SET NULL,
    crop_cycle_id UUID REFERENCES crop_cycles(id) ON DELETE SET NULL,
    paid_by VARCHAR(255),
    receipt_ref VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create petty_cash_ledger Table
CREATE TABLE IF NOT EXISTS petty_cash_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    opening_balance NUMERIC(12, 2) NOT NULL,
    amount_in NUMERIC(12, 2) NOT NULL DEFAULT 0,
    amount_out NUMERIC(12, 2) NOT NULL DEFAULT 0,
    closing_balance NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_machine_usage_machine_id ON machine_usage_logs(machine_id);
CREATE INDEX IF NOT EXISTS idx_machine_usage_date ON machine_usage_logs(date);
CREATE INDEX IF NOT EXISTS idx_machine_usage_plot_id ON machine_usage_logs(plot_id);
CREATE INDEX IF NOT EXISTS idx_machine_usage_crop_cycle_id ON machine_usage_logs(crop_cycle_id);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_plot_id ON expenses(plot_id);
CREATE INDEX IF NOT EXISTS idx_expenses_crop_cycle_id ON expenses(crop_cycle_id);

CREATE INDEX IF NOT EXISTS idx_petty_cash_date ON petty_cash_ledger(date);

-- 7. View: Machine & Plot Consumption Report
CREATE OR REPLACE VIEW v_machine_plot_consumption AS
SELECT 
    m.id AS machine_id,
    m.name AS machine_name,
    m.type AS machine_type,
    p.id AS plot_id,
    p.name AS plot_name,
    COUNT(mul.id) AS usage_count,
    COALESCE(SUM(mul.hours_used), 0) AS total_hours,
    COALESCE(SUM(mul.fuel_cost), 0) AS total_fuel_cost,
    COALESCE(SUM(mul.maintenance_cost), 0) AS total_maintenance_cost,
    (COALESCE(SUM(mul.fuel_cost), 0) + COALESCE(SUM(mul.maintenance_cost), 0)) AS total_operating_cost
FROM machines m
LEFT JOIN machine_usage_logs mul ON m.id = mul.machine_id
LEFT JOIN plots p ON mul.plot_id = p.id
GROUP BY m.id, m.name, m.type, p.id, p.name;

-- 8. View: Consolidated Estate Ledger (Master cross-module summary)
CREATE OR REPLACE VIEW v_consolidated_estate_ledger AS
SELECT 
    'CROP_EXPENSE' AS record_type,
    ce.id,
    ce.date,
    p.name AS plot_name,
    cc.crop_name,
    ce.category::TEXT AS category,
    ce.description,
    ce.amount AS debit_expense,
    0.00 AS credit_income
FROM crop_expenses ce
JOIN crop_cycles cc ON ce.crop_cycle_id = cc.id
JOIN plots p ON cc.plot_id = p.id
UNION ALL
SELECT 
    'CROP_INCOME' AS record_type,
    ci.id,
    ci.date,
    p.name AS plot_name,
    cc.crop_name,
    ci.source::TEXT AS category,
    CONCAT('Sale to ', COALESCE(ci.buyer_name, 'Direct Market'), ' (', ci.quantity_sold, ' ', ci.unit, ')') AS description,
    0.00 AS debit_expense,
    ci.amount AS credit_income
FROM crop_incomes ci
JOIN crop_cycles cc ON ci.crop_cycle_id = cc.id
JOIN plots p ON cc.plot_id = p.id
UNION ALL
SELECT 
    'WAGE_PAYMENT' AS record_type,
    we.id,
    we.date,
    COALESCE(p.name, 'Estate Wide') AS plot_name,
    COALESCE(cc.crop_name, 'General Estate') AS crop_name,
    'LABOR_WAGE' AS category,
    CONCAT('Wages for ', w.name, ' (Status: ', we.paid_status::TEXT, ')') AS description,
    we.computed_amount AS debit_expense,
    0.00 AS credit_income
FROM wage_entries we
JOIN workers w ON we.worker_id = w.id
LEFT JOIN crop_cycles cc ON we.crop_cycle_id = cc.id
LEFT JOIN plots p ON cc.plot_id = p.id
UNION ALL
SELECT 
    'MACHINE_OPERATION' AS record_type,
    mul.id,
    mul.date,
    COALESCE(p.name, 'Estate Fleet') AS plot_name,
    COALESCE(cc.crop_name, 'General Fieldwork') AS crop_name,
    'MACHINERY' AS category,
    CONCAT(m.name, ' - ', mul.work_description, ' (', mul.hours_used, ' hrs)') AS description,
    (COALESCE(mul.fuel_cost, 0) + COALESCE(mul.maintenance_cost, 0)) AS debit_expense,
    0.00 AS credit_income
FROM machine_usage_logs mul
JOIN machines m ON mul.machine_id = m.id
LEFT JOIN plots p ON mul.plot_id = p.id
LEFT JOIN crop_cycles cc ON mul.crop_cycle_id = cc.id
UNION ALL
SELECT 
    'FARM_EXPENSE' AS record_type,
    e.id,
    e.date,
    COALESCE(p.name, 'General Overhead') AS plot_name,
    COALESCE(cc.crop_name, 'Estate Admin') AS crop_name,
    e.category::TEXT AS category,
    e.description,
    e.amount AS debit_expense,
    0.00 AS credit_income
FROM expenses e
LEFT JOIN plots p ON e.plot_id = p.id
LEFT JOIN crop_cycles cc ON e.crop_cycle_id = cc.id;
