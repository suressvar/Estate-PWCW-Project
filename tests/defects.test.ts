import { describe, expect, it } from 'vitest';
import { getDatabase } from '../src/lib/db-storage';
import { generatePnLStatement } from '../src/lib/pnl-data';
import { createWorker, updateWorker } from '../src/lib/worker-data';
import { createOperationItem } from '../src/lib/operation-items-data';
import { createMultiItemSale } from '../src/lib/sales-data';
import { createVoucher, deleteVoucher, updateVoucher } from '../src/lib/vouchers-data';
import { addExpense, updateExpense } from '../src/lib/expenses-data';
import { createMachine, addMachineUsageLog, deleteMachine } from '../src/lib/machinery-data';
import { POST } from '../src/app/api/workers/route';

// Ordinary failing regressions: do not skip or invert these to hide defects.
describe('confirmed defect regressions', () => {
  it('D01 excludes paid wages outside the selected P&L period', () => {
    getDatabase().wages = [{ status: 'PAID', netSalary: 1000, year: 2025, month: 1, paymentDate: '2025-01-31' } as never];
    expect(generatePnLStatement('2026-11-01', '2026-11-30').summary.totalExpenses).toBe(0);
  });
  it('D02 includes indirect expenses in P&L totals', () => {
    getDatabase().otherVouchers = [{ pnlCategory: 'Indirect Expenses', amount: 300, voucherDate: '2026-11-15' } as never];
    expect(generatePnLStatement('2026-11-01', '2026-11-30').summary.totalExpenses).toBe(300);
  });
  it('D03 rejects a nonnumeric worker wage', () => {
    expect(() => createWorker({ name: 'A', dailyWageRate: NaN })).toThrow();
  });
  it('D04 rejects a missing wage through the worker API', async () => {
    const response = await POST(new Request('http://localhost/api/workers', { method: 'POST', body: JSON.stringify({ name: 'A' }) }));
    expect(response.status).toBe(400);
  });
  it('D05 preserves an explicit zero stock-alert threshold', () => {
    const result = createOperationItem({ name: 'Urea', category: 'Fertilizer & Nutrition', minStockAlert: 0 } as never);
    expect(result.item?.minStockAlert).toBe(0);
  });
  it('D06 rejects negative expenses when updating', () => {
    const expense = addExpense({ category: 'GENERAL', amount: 100, date: '2026-11-15', description: 'Tools' });
    expect(() => updateExpense(expense.id, { amount: -100 })).toThrow();
  });
  it('D07 rejects zero sale quantities instead of invoicing one unit', () => {
    expect(() => createMultiItemSale('crop', { items: [{ itemName: 'Tomato', quantity: 0, pricePerUnit: 100 }] })).toThrow();
  });
  it('D08 synchronizes godown stock when a purchase voucher quantity changes', () => {
    const v = createVoucher('feed', { quantity: 10, cost: 100 });
    updateVoucher('feed', v.id, { quantity: 20, cost: 200 });
    expect(getDatabase().godownItems?.[0].availableQuantity).toBe(20);
  });
  it('D09 reverses unused inward stock when deleting a purchase voucher', () => {
    const v = createVoucher('feed', { quantity: 10, cost: 100 }); deleteVoucher('feed', v.id);
    expect(getDatabase().godownItems?.reduce((s, i) => s + i.availableQuantity, 0)).toBe(0);
  });
  it('D10 removes synced crop expenses when deleting a machine and its usage', () => {
    const m = createMachine({ name: 'Tractor' });
    addMachineUsageLog({ machineId: m.id, date: '2026-11-15', hoursUsed: 1, workDescription: 'Tilling', fuelCost: 100, cropCycleId: 'cycle' });
    deleteMachine(m.id);
    expect(getDatabase().cropExpenses).toEqual([]);
  });
  it('D11 rejects negative worker wages on update', () => {
    const w = createWorker({ name: 'A', dailyWageRate: 800 });
    expect(() => updateWorker(w.id, { dailyWageRate: -1 })).toThrow();
  });
});
