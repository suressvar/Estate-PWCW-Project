import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDatabase } from '../src/lib/db-storage';
import * as master from '../src/lib/master-data';
import * as hr from '../src/lib/hr-data';
import * as sales from '../src/lib/sales-data';
import * as inventory from '../src/lib/inventory-data';
import * as accounting from '../src/lib/accounting-data';
import * as parties from '../src/lib/parties-data';

afterEach(() => vi.restoreAllMocks());
const plot = () => master.createPlot({ name: 'North', areaAcres: 5, location: 'Estate', status: 'ACTIVE' });
const employee = (name = 'Sam', wageRate = 600) => hr.createEmployee({ name, wageRate, wageType: 'DAILY', status: 'ACTIVE' });
const sale = () => sales.createMultiItemSale('other', { items: [{ itemName: 'Tomato', quantity: 2, pricePerUnit: 50 }] });

describe('record identity under rapid writes', () => {
  it.each([
    ['plot', plot],
    ['employee', employee],
    ['crop', () => master.createCrop({ name: 'Tomato', type: 'CROP' })],
    ['role', () => hr.createEmployeeRole('Field worker')],
    ['party', () => parties.createParty({ name: 'Vendor', type: 'Vendor' })],
    ['ledger group', () => accounting.createLedgerGroup({ groupName: 'Inputs', groupType: 'EXPENSE', pnlSide: 'DEBIT', description: '' })],
  ] as const)('creates distinct %s IDs within one millisecond', (_name, create) => {
    vi.spyOn(Date, 'now').mockReturnValue(1794787200000);
    expect(create().id).not.toBe(create().id);
  });
  it('keeps separate invoices separate when created in the same millisecond', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1794787200000);
    const first = sale(); const second = sale();
    expect(first.invoiceGroupId).not.toBe(second.invoiceGroupId);
    expect(first.items[0].id).not.toBe(second.items[0].id);
    expect(sales.getSalesByInvoiceGroup(first.invoiceGroupId).otherItems).toHaveLength(1);
  });
  it('rejects primary-key replacement without altering a plot', () => {
    const item = plot();
    expect(() => master.updatePlot(item.id, { id: 'replacement' })).toThrow();
    expect(master.getPlots()[0].id).toBe(item.id);
  });
  it('does not join attendance of distinct employees sharing a name', () => {
    const first = employee(); const second = employee();
    hr.markAttendance({ employeeId: first.id, attendanceDate: '2026-11-16', status: 'PRESENT' });
    const summary = hr.getAttendanceSummary(2026, 11);
    expect(summary.find(row => row.employeeId === second.id)?.presentDays).toBe(0);
  });
  it('preserves an explicitly zero employee wage in the worker projection', () => {
    const item = employee('Volunteer', 0);
    expect(getDatabase().workers?.find(row => row.id === item.id)?.dailyWageRate).toBe(0);
  });
});

describe('financial mutation boundaries', () => {
  it.each([-1, NaN, Infinity])('rejects invalid inventory consumption %s', value => {
    getDatabase().feedInventory.push({ id: 'stock', openingStock: 10, purchasedQty: 0, usedQty: 0, wastageQty: 0, costPerUnit: 2, alertLevel: 0 } as never);
    expect(() => inventory.updateInventoryRecord('feed', 'stock', { usedQty: value })).toThrow();
    expect(getDatabase().feedInventory[0].usedQty).toBe(0);
  });
  it('rejects consumption exceeding available inventory', () => {
    getDatabase().feedInventory.push({ id: 'stock', openingStock: 10, purchasedQty: 0, usedQty: 0, wastageQty: 0, costPerUnit: 2, alertLevel: 0 } as never);
    expect(() => inventory.updateInventoryRecord('feed', 'stock', { usedQty: 11 })).toThrow();
  });
  it.each([{ bonus: -1 }, { deductions: Infinity }, { grossSalary: NaN }])('rejects invalid wage adjustments %j', changes => {
    const item = employee(); hr.markAttendance({ employeeId: item.id, attendanceDate: '2026-11-16', status: 'PRESENT' });
    const wage = hr.calculateSalariesForMonth(2026, 11)[0];
    expect(() => hr.updateWageRecord(wage.id, changes)).toThrow();
    expect(getDatabase().wages[0].netSalary).toBe(600);
  });
  it('does not silently recalculate an already paid salary after attendance changes', () => {
    const item = employee(); hr.markAttendance({ employeeId: item.id, attendanceDate: '2026-11-16', status: 'PRESENT' });
    const wage = hr.calculateSalariesForMonth(2026, 11)[0];
    hr.markWagePaid(wage.id, { paymentDate: '2026-11-16', paymentMode: 'Cash' });
    hr.markAttendance({ employeeId: item.id, attendanceDate: '2026-11-17', status: 'PRESENT' });
    hr.calculateSalariesForMonth(2026, 11);
    expect(getDatabase().wages[0].netSalary).toBe(600);
  });
  it('rejects orphan crop assignments without partially saving the batch', () => {
    const target = plot(); const crop = master.createCrop({ name: 'Tomato', type: 'CROP' });
    expect(() => master.createPlotCrops(target.id, [crop.id, 'missing'], '2026-11-16')).toThrow();
    expect(master.getPlotCrops()).toEqual([]);
  });
});
