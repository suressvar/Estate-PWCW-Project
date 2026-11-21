import { describe, expect, it, vi, afterEach } from 'vitest';
import { getDatabase, saveDatabase } from '../src/lib/db-storage';
import { seedRecords } from './helpers/seed';
import * as master from '../src/lib/master-data';
import * as hr from '../src/lib/hr-data';
import * as workers from '../src/lib/worker-data';
import * as parties from '../src/lib/parties-data';
import * as inventory from '../src/lib/inventory-data';
import * as accounting from '../src/lib/accounting-data';
import * as sales from '../src/lib/sales-data';
import * as logs from '../src/lib/transaction-logs';
import { calculateVoucherTotals, money } from '../src/lib/money';
import { createSession, readSession } from '../src/lib/auth';
import { generatePnLStatement } from '../src/lib/pnl-data';
import { formatInvoiceReference } from '../src/lib/references';
const date = '2026-11-21';

afterEach(() => vi.unstubAllEnvs());
describe('monetary calculations and tamper resistance', () => {
  it('retains distinct printed invoice references even when their suffixes match', () => {
    expect(formatInvoiceReference('inv_first-abcd')).not.toBe(formatInvoiceReference('inv_second-abcd'));
    expect(formatInvoiceReference('inv_first-abcd')).toBe('INV-OTH-first-abcd');
  });
  it('does not reuse sales row references after all earlier rows are deleted', () => {
    const first = sales.createMultiItemSale('other', { items: [{ itemName: 'A', quantity: 1, pricePerUnit: 1 }] });
    sales.deleteSale('other', first.items[0].id);
    const second = sales.createMultiItemSale('other', { items: [{ itemName: 'A', quantity: 1, pricePerUnit: 1 }] });
    expect(second.items[0].srNo).not.toBe(first.items[0].srNo);
  });
  it('does not reuse a purchase voucher number after deletion', () => {
    const first = logs.addGeneralPurchaseLog({ cost: 1, date: '2026-11-16' } as never);
    logs.deleteGeneralPurchaseLog(first.id);
    const second = logs.addGeneralPurchaseLog({ cost: 1, date: '2026-11-16' } as never);
    expect(first.voucherNo).toBe('PUR-VCH-2026-001'); expect(second.voucherNo).toBe('PUR-VCH-2026-002');
  });
  it('rejects duplicate custom voucher references without adding a second record', () => {
    logs.addGeneralPurchaseLog({ date, cost: 1, voucherNo: 'CUSTOM-1' } as never);
    expect(() => logs.addGeneralPurchaseLog({ date, cost: 1, voucherNo: 'CUSTOM-1' } as never)).toThrow(/already exists/);
    expect(getDatabase().generalPurchaseLogs).toHaveLength(1);
  });
  it('rejects non-text custom voucher references before persistence', () => {
    expect(() => logs.addGeneralPurchaseLog({ date, cost: 1, voucherNo: 42 } as never)).toThrow();
    expect(getDatabase().generalPurchaseLogs).toEqual([]);
  });
  it('rejects a custom sales reference already used by a different invoice', () => {
    sales.createMultiItemSale('other', { recordNo: 'CUSTOM-1', items: [{ itemName: 'A', quantity: 1, pricePerUnit: 1 }] });
    expect(() => sales.createMultiItemSale('other', { recordNo: 'CUSTOM-1', items: [{ itemName: 'A', quantity: 1, pricePerUnit: 1 }] })).toThrow(/already exists/);
    expect(getDatabase().otherSales).toHaveLength(1);
  });
  it('uses only the stock valuation matching the requested report period', () => {
    inventory.createStockValuation({ periodName: '2025', fromDate: '2025-01-01', toDate: '2025-12-31', openingStock: 100, closingStock: 200 });
    inventory.createStockValuation({ periodName: '2026', fromDate: '2026-01-01', toDate: '2026-12-31', openingStock: 300, closingStock: 400 });
    expect(generatePnLStatement('2025-01-01', '2025-12-31').summary).toMatchObject({ openingStock: 100, closingStock: 200, stockValuationMatched: true });
    expect(generatePnLStatement('2027-01-01', '2027-12-31').summary).toMatchObject({ openingStock: 0, closingStock: 0, stockValuationMatched: false });
  });
  it('derives line, tax, discount and total values on the server', () => {
    const result = calculateVoucherTotals([{ description: 'Urea', quantity: 2, rate: 10.25, amount: 1 }], 10, 1);
    expect(result).toMatchObject({ subtotal: 20.5, taxAmount: 2.05, discount: 1, total: 21.55 });
    expect(result.items[0].amount).toBe(20.5);
  });
  it.each([NaN, Infinity, 1e20])('rejects unsupported monetary result %s', value => expect(() => money(value)).toThrow());
  it.each([-1, 101, Infinity])('rejects invalid tax percentage %s', value => expect(() => calculateVoucherTotals([{ description: 'A', quantity: 1, rate: 10 }], value)).toThrow());
  it.each([-1, 11, Infinity])('rejects invalid discount %s', value => expect(() => calculateVoucherTotals([{ description: 'A', quantity: 1, rate: 10 }], 0, value)).toThrow());
  it('handles decimal currency rather than storing binary floating-point tails', () => {
    expect(calculateVoucherTotals([{ description: 'A', quantity: 3, rate: 0.1 }]).total).toBe(0.3);
    expect(money(1.005)).toBe(1.01);
  });
  it('ignores forged purchase totals and line amounts', () => {
    const item = logs.addGeneralPurchaseLog({ date, items: [{ id: 'line', description: 'Urea', quantity: 2, unit: 'kg', rate: 10, amount: 1 }], cost: 1, subtotal: 1, taxPercent: 10, taxAmount: 999, discount: 0 } as never);
    expect(item).toMatchObject({ cost: 22, subtotal: 20, taxAmount: 2 });
  });
  it('rejects a sale whose quantity times price exceeds supported currency', () => {
    expect(() => sales.createMultiItemSale('other', { items: [{ itemName: 'A', quantity: 1e12, pricePerUnit: 1e12 }] })).toThrow();
    expect(getDatabase().otherSales).toEqual([]);
  });
});

describe('rollback at every master-data write boundary', () => {
  const mutations = [
    ['plot create', () => master.createPlot({ name: 'New', areaAcres: 3, location: 'Test', status: 'ACTIVE' })],
    ['plot delete', () => master.deletePlot(getDatabase().plots[0].id)],
    ['crop update', (r: ReturnType<typeof seedRecords>) => master.updateCrop(r.crop.id, { name: 'Changed' })],
    ['party update', (r: ReturnType<typeof seedRecords>) => parties.updateParty(r.party.id, { name: 'Changed' })],
    ['role update', (r: ReturnType<typeof seedRecords>) => hr.updateEmployeeRole(r.role.id, { roleName: 'Changed' })],
    ['group update', (r: ReturnType<typeof seedRecords>) => accounting.updateLedgerGroup(r.group.id, { groupName: 'Changed' })],
    ['ledger update', (r: ReturnType<typeof seedRecords>) => accounting.updateExpenseLedger(r.ledger.id, { ledgerName: 'Changed' })],
    ['stock valuation', () => inventory.createStockValuation({ periodName: 'Test', fromDate: '2026-01-01', toDate: '2026-12-31', openingStock: 1, closingStock: 2 } as never)],
    ['sale delete', (r: ReturnType<typeof seedRecords>) => sales.deleteSale('other', r.sale.items[0].id)],
    ['salary update', () => hr.updateWageRecord(getDatabase().wages[0].id, { bonus: 200 })],
  ] as const;
  it.each(mutations)('%s restores the entire store after failed persistence', (_name, change) => {
    const records = seedRecords(); master.createPlot({ name: 'Unreferenced', areaAcres: 1, status: 'ACTIVE', location: 'Test' }); const original = structuredClone(getDatabase());
    vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('Disk full'); });
    expect(() => change(records)).toThrow('Disk full');
    expect(getDatabase()).toEqual(original);
  });
});

describe('history preservation and account rotation', () => {
  it('refuses employee and worker deletion when money has been paid', () => {
    const r = seedRecords();
    hr.markWagePaid(getDatabase().wages[0].id, { paymentDate: r.date, paymentMode: 'Cash' });
    const original = structuredClone(getDatabase());
    expect(hr.deleteEmployee(r.employee.id, true)).toBe(false);
    expect(workers.deleteWorker(r.employee.id)).toBe(false);
    expect(getDatabase()).toEqual(original);
  });
  it.each([[2026, 0, 26], [2026, 13, 26], [2026, 1, 0], [2026, 1, 32], [NaN, 1, 26]])('rejects invalid salary period %j', (year, month, days) => {
    expect(() => hr.calculateSalariesForMonth(year, month, days)).toThrow();
    expect(getDatabase().wages).toEqual([]);
  });
  it('invalidates existing sessions when the administrator password hash changes', () => {
    vi.stubEnv('ESTATE_ADMIN_USERNAME', 'Admin'); vi.stubEnv('ESTATE_SESSION_SECRET', 'test-session-secret-at-least-thirty-two-characters');
    vi.stubEnv('ESTATE_ADMIN_PASSWORD_HASH', 'original');
    const token = createSession('Admin'); expect(readSession(token)).not.toBeNull();
    vi.stubEnv('ESTATE_ADMIN_PASSWORD_HASH', 'replacement'); expect(readSession(token)).toBeNull();
  });
});
