import { describe, expect, it } from 'vitest';
import { getDatabase } from '../src/lib/db-storage';
import * as logs from '../src/lib/transaction-logs';
import * as workers from '../src/lib/worker-data';
import * as hr from '../src/lib/hr-data';
import * as inventory from '../src/lib/inventory-data';
import * as crop from '../src/lib/crop-cycle-data';
import { createPlot } from '../src/lib/master-data';

const date = '2026-11-15';
describe('transaction logs', () => {
  it('records fertilizer, diesel, labor, machinery and production with generated IDs', () => {
    const base = { date, loggedBy: 'Tester' };
    logs.addFertilizerLog({ ...base, transactionType: 'PURCHASE', fertilizerName: 'Urea', quantityKg: 10, cost: 100 });
    logs.addDieselLog({ ...base, transactionType: 'PURCHASE', quantityLiters: 20, cost: 200 });
    logs.addLaborLog({ ...base, menCount: 1, womenCount: 1, menWageRate: 500, womenWageRate: 500, totalCost: 1000 });
    logs.addMachineryLog({ ...base, machineName: 'Tractor', startTime: '08:00', endTime: '10:00', runningHours: 2, dieselConsumedLiters: 3 });
    logs.addProductionLog({ ...base, quantityKg: 20 });
    for (const records of [logs.getFertilizerLogs(), logs.getDieselLogs(), logs.getLaborLogs(), logs.getMachineryLogs(), logs.getProductionLogs()]) {
      expect(records).toHaveLength(1); expect(records[0].id).toBeTruthy(); expect(records[0].date).toBe(date);
    }
    logs.resetTransactionLogs();
    expect(logs.getFertilizerLogs()).toEqual([]); expect(logs.getDieselLogs()).toEqual([]);
  });
  it('generates voucher references and preserves supplied subtotals', () => {
    const sale = logs.addSalesLog({ date, loggedBy: 'Tester', quantityKg: 2, value: 100 } as never);
    const purchase = logs.addGeneralPurchaseLog({ date, loggedBy: 'Tester', cost: 200, subtotal: 180 } as never);
    expect(sale.subtotal).toBe(100); expect(sale.voucherNo).toContain('001');
    expect(purchase.subtotal).toBe(180); expect(purchase.voucherNo).toContain('001');
    logs.deleteSalesLog(sale.id); logs.deleteGeneralPurchaseLog(purchase.id);
    expect(logs.getSalesLogs()).toEqual([]); expect(logs.getGeneralPurchaseLogs()).toEqual([]);
  });
  it('creates and removes purchase categories without duplicates', () => {
    logs.createPurchaseCategory(' Custom '); logs.createPurchaseCategory('Custom');
    expect(logs.getPurchaseCategories()).toEqual(['Custom']);
    expect(logs.deletePurchaseCategory('Custom')).toEqual([]);
  });
});

describe('worker attendance, wage register and summaries', () => {
  const makeWorker = () => hr.createEmployee({ name: 'A', wageRate: 800, wageType: 'DAILY', status: 'ACTIVE' } as never);
  it('upserts attendance and crop wages without double counting', () => {
    const w = makeWorker();
    const plot = createPlot({ name: 'North', location: 'Estate', areaAcres: 5, status: 'ACTIVE' });
    const cycle = crop.createCropCycle({ plotId: plot.id, cropName: 'Tomato', sowingDate: date, expectedHarvestDate: '2027-02-01' });
    const entry = workers.upsertWorkerAttendanceAndWage({ workerId: w.id, date, status: 'PRESENT', cropCycleId: cycle.id });
    expect(entry.wage.computedAmount).toBe(800);
    workers.recordWagePayment(entry.wage.id, { paidAmount: 400 });
    const changed = workers.upsertWorkerAttendanceAndWage({ workerId: w.id, date, status: 'HALF_DAY', cropCycleId: cycle.id });
    expect(changed.wage).toMatchObject({ computedAmount: 400, paidAmount: 400, paidStatus: 'PAID' });
    expect(getDatabase().workerAttendances).toHaveLength(1); expect(getDatabase().wageEntries).toHaveLength(1);
    expect(getDatabase().cropExpenses).toHaveLength(1); expect(getDatabase().cropExpenses?.[0].amount).toBe(400);
    expect(workers.getWageRegister()).toBeDefined(); expect(workers.getMonthlyWorkerSummary(2026, 11)).toBeDefined();
    expect(workers.getDailyAttendanceSheet(date)).toBeDefined();
    workers.upsertWorkerAttendanceAndWage({ workerId: w.id, date, status: 'ABSENT', cropCycleId: null });
    expect(getDatabase().cropExpenses).toEqual([]);
  });
  it('rejects missing worker/date and payment of nonexistent wages', () => {
    expect(() => workers.upsertWorkerAttendanceAndWage({ workerId: 'missing', date, status: 'PRESENT' })).toThrow();
    expect(() => workers.upsertWorkerAttendanceAndWage({ workerId: makeWorker().id, date: '', status: 'PRESENT' })).toThrow();
    expect(workers.recordWagePayment('missing', { paidAmount: 10 })).toBeUndefined();
  });
  it('cascades worker deletion to attendance and wages', () => {
    const w = makeWorker(); workers.upsertWorkerAttendanceAndWage({ workerId: w.id, date, status: 'PRESENT' });
    workers.deleteWorker(w.id);
    expect(getDatabase().workers).toEqual([]); expect(getDatabase().wageEntries).toEqual([]); expect(getDatabase().attendance).toEqual([]);
  });
});

describe('leave and stock valuation lifecycles', () => {
  it('marks each inclusive approved leave date in attendance', () => {
    const e = hr.createEmployee({ name: 'A', wageRate: 800, wageType: 'DAILY', status: 'ACTIVE' } as never);
    const leave = hr.createLeave({ employeeId: e.id, fromDate: date, toDate: '2026-11-17', leaveType: 'CASUAL', reason: 'Personal', status: 'APPROVED' } as never);
    expect(leave.totalDays).toBe(3); expect(getDatabase().attendance).toHaveLength(3);
    expect(getDatabase().attendance.every(a => a.status === 'LEAVE')).toBe(true);
    expect(hr.getLeaves()).toHaveLength(1); hr.deleteLeave(leave.id); expect(hr.getLeaves()).toEqual([]);
  });
  it('does not mark attendance for pending leave', () => {
    hr.createLeave({ employeeId: 'A', fromDate: date, toDate: date, leaveType: 'CASUAL', status: 'PENDING' } as never);
    expect(getDatabase().attendance).toEqual([]);
  });
  it('creates, edits and deletes manual valuations', () => {
    const v = inventory.createStockValuation({ periodName: 'FY2026', fromDate: '2026-01-01', toDate: '2026-12-31', openingStock: 100, closingStock: 200 } as never);
    expect(inventory.getStockValuations()).toHaveLength(1);
    expect(inventory.updateStockValuation(v.id, { closingStock: 300 })?.closingStock).toBe(300);
    inventory.deleteStockValuation(v.id); expect(inventory.getStockValuations()).toEqual([]);
  });
});
