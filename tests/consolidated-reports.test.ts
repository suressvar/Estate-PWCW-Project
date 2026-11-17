import { describe, expect, it } from 'vitest';
import { getDatabase } from '../src/lib/db-storage';
import { createPlot } from '../src/lib/master-data';
import { createCropCycle, addCropExpense, addCropIncome, syncOperationsToCropCycle } from '../src/lib/crop-cycle-data';
import { addExpense } from '../src/lib/expenses-data';
import { createEmployee } from '../src/lib/hr-data';
import { upsertWorkerAttendanceAndWage } from '../src/lib/worker-data';
import { createMachine, addMachineUsageLog } from '../src/lib/machinery-data';
import { getConsolidatedReport, generateConsolidatedReportCsv } from '../src/lib/consolidated-report-data';
const date = '2026-11-15';
const fixture = () => {
  const plot = createPlot({ name: 'North', location: 'Estate', areaAcres: 5, status: 'ACTIVE' });
  const cycle = createCropCycle({ plotId: plot.id, cropName: 'Tomato', sowingDate: date, expectedHarvestDate: '2027-02-01' });
  return { plot, cycle };
};
describe('populated consolidated reports', () => {
  it('aggregates direct crop expenses and sales', () => {
    const { cycle } = fixture();
    addCropExpense({ cropCycleId: cycle.id, category: 'LABOR', amount: 100, date, description: 'Labor' });
    addCropIncome({ cropCycleId: cycle.id, source: 'MARKET_SALE', quantitySold: 10, ratePerUnit: 30, unit: 'kg', date });
    expect(getConsolidatedReport().kpis).toMatchObject({ totalIncome: 300, totalExpenses: 100, netProfitLoss: 200, profitMarginPercent: 66.7 });
    expect(getConsolidatedReport().ledger).toHaveLength(2);
  });
  it('filters transactions by date and crop cycle', () => {
    const { cycle } = fixture();
    addCropExpense({ cropCycleId: cycle.id, category: 'LABOR', amount: 100, date, description: 'Labor' });
    expect(getConsolidatedReport({ startDate: '2027-01-01' }).kpis.totalExpenses).toBe(0);
    expect(getConsolidatedReport({ cropCycleId: 'missing' }).kpis.totalExpenses).toBe(0);
    expect(getConsolidatedReport({ cropCycleId: cycle.id }).kpis.totalExpenses).toBe(100);
  });
  it('escapes quotes, commas and newlines in exported CSV', () => {
    addExpense({ category: 'GENERAL', amount: 12.5, date, description: 'Tools, "large"\nNew line' });
    expect(generateConsolidatedReportCsv()).toContain('"Tools, ""large""\nNew line"');
    expect(generateConsolidatedReportCsv()).toContain('12.50');
  });
  it('syncs operational labor/machinery once and updates existing amounts', () => {
    const { cycle, plot } = fixture();
    getDatabase().laborLogs = [{ id: 'l', plotName: plot.name, date, totalCost: 100, menCount: 1, womenCount: 0 } as never];
    getDatabase().machineryLogs = [{ id: 'm', plotName: plot.name, date, runningHours: 2, machineName: 'Tractor', dieselConsumedLiters: 0 } as never];
    expect(syncOperationsToCropCycle(cycle.id)).toMatchObject({ syncedCount: 2, totalExpensesAdded: 1100 });
    getDatabase().laborLogs[0].totalCost = 200;
    expect(syncOperationsToCropCycle(cycle.id).syncedCount).toBe(0);
    expect(getDatabase().cropExpenses).toHaveLength(2);
    expect(getDatabase().cropExpenses?.reduce((s, e) => s + e.amount, 0)).toBe(1200);
  });
});
describe('additional financial defect regressions', () => {
  it('D14 counts a tagged general expense once in consolidated totals', () => {
    const { cycle } = fixture();
    addExpense({ category: 'GENERAL', amount: 100, date, description: 'Tools', cropCycleId: cycle.id });
    expect(getConsolidatedReport().kpis.totalExpenses).toBe(100);
  });
  it('D15 includes untagged machine operating expenses in estate totals', () => {
    const machine = createMachine({ name: 'Tractor' });
    addMachineUsageLog({ machineId: machine.id, date, hoursUsed: 1, workDescription: 'Tilling', fuelCost: 100 });
    expect(getConsolidatedReport().kpis.totalExpenses).toBe(100);
  });
  it('D16 includes untagged worker wages in estate expenses', () => {
    const worker = createEmployee({ name: 'A', status: 'ACTIVE', wageType: 'DAILY', wageRate: 800 } as never);
    upsertWorkerAttendanceAndWage({ workerId: worker.id, date, status: 'PRESENT' });
    expect(getConsolidatedReport().kpis.totalExpenses).toBe(800);
  });
  it('D17 excludes other plots wages when filtering consolidated reports', () => {
    const { plot } = fixture();
    const worker = createEmployee({ name: 'A', status: 'ACTIVE', wageType: 'DAILY', wageRate: 800 } as never);
    upsertWorkerAttendanceAndWage({ workerId: worker.id, date, status: 'PRESENT' });
    expect(getConsolidatedReport({ plotId: plot.id }).kpis.laborWageExpenses).toBe(0);
  });
});
