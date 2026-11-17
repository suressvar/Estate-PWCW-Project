import { describe, expect, it } from 'vitest';
import { getDatabase } from '../src/lib/db-storage';
import * as master from '../src/lib/master-data';
import * as workers from '../src/lib/worker-data';
import * as daily from '../src/lib/daily-log-data';
import * as crop from '../src/lib/crop-cycle-data';
import * as expenses from '../src/lib/expenses-data';
import * as machines from '../src/lib/machinery-data';
import * as operations from '../src/lib/operation-items-data';
import * as inventory from '../src/lib/inventory-data';
import * as parties from '../src/lib/parties-data';
import * as accounting from '../src/lib/accounting-data';
import * as vouchers from '../src/lib/vouchers-data';
import * as sales from '../src/lib/sales-data';
import * as godown from '../src/lib/godown-data';
import * as hr from '../src/lib/hr-data';
import { generatePnLStatement } from '../src/lib/pnl-data';
import { getConsolidatedReport, generateConsolidatedReportCsv } from '../src/lib/consolidated-report-data';

const date = '2026-11-15';
const makePlot = () => master.createPlot({ name: 'North', location: 'Estate', areaAcres: 5, status: 'ACTIVE' });
const makeCycle = () => crop.createCropCycle({ plotId: makePlot().id, cropName: ' Tomato ', sowingDate: '2026-11-01', expectedHarvestDate: '2027-01-01' });
const makeItem = (overrides = {}) => operations.createOperationItem({ itemCode: '', name: ' Urea ', category: 'Fertilizer & Nutrition', unit: 'kg', defaultRate: 20, currentStock: 10, minStockAlert: 5, status: 'ACTIVE', ...overrides });

describe('master data and accounting', () => {
  it('creates, edits, looks up and deletes plots', () => {
    const plot = makePlot();
    expect(master.updatePlot(plot.id, { areaAcres: 7 })?.areaAcres).toBe(7);
    expect(master.getPlots()).toHaveLength(1);
    master.deletePlot(plot.id);
    expect(master.getPlots()).toEqual([]);
  });
  it('normalizes crop categories and prevents duplicates', () => {
    master.createCropCategory(' vegetables '); master.createCropCategory('VEGETABLES');
    expect(master.getCropCategories()).toEqual(['VEGETABLES']);
    master.deleteCropCategory('VEGETABLES');
    expect(getDatabase().cropCategories).toEqual([]);
  });
  it('links crops by name or ID and prevents duplicate active links', () => {
    const plot = makePlot(); const c = master.createCrop({ name: 'Tomato', type: ' crop ' });
    const link = master.createPlotCrop(plot.id, c.id, date);
    expect(master.createPlotCrop(plot.name, c.name, date)?.id).toBe(link?.id);
    expect(master.getPlotCrops()).toHaveLength(1);
    master.deleteCrop(c.id);
    expect(master.getPlotCrops()).toEqual([]);
  });
  it('protects ledger groups and group types in use', () => {
    const group = accounting.createLedgerGroup({ groupName: 'Inputs', groupType: ' expense ', pnlSide: 'DEBIT', description: '' });
    const ledger = accounting.createExpenseLedger({ ledgerName: 'Urea', groupId: group.id });
    expect(accounting.getExpenseLedgerById(ledger.id)?.groupType).toBe('EXPENSE');
    expect(accounting.deleteGroupType('EXPENSE')).toBe(false);
    expect(accounting.deleteLedgerGroup(group.id)).toBe(false);
    accounting.deleteExpenseLedger(ledger.id);
    expect(accounting.deleteLedgerGroup(group.id)).toBe(true);
  });
  it.each(['Customer', 'Retailer', 'Vendor'] as const)('includes Both parties in %s results', (type) => {
    parties.createParty({ name: 'Both', type: 'Both' });
    parties.createParty({ name: 'Specific', type });
    expect(parties.getParties(type)).toHaveLength(2);
  });
  it('edits and removes a party, reporting missing records', () => {
    const p = parties.createParty({ name: 'Vendor', type: 'Vendor' });
    expect(parties.updateParty(p.id, { name: 'Updated' })?.name).toBe('Updated');
    expect(parties.getPartyById(p.id)?.name).toBe('Updated');
    expect(parties.deleteParty(p.id)).toBe(true);
    expect(parties.deleteParty(p.id)).toBe(false);
    expect(parties.updateParty('missing', {})).toBeUndefined();
  });
});

describe('workers, attendance and salary', () => {
  it.each([{ name: '', dailyWageRate: 800 }, { name: ' ', dailyWageRate: 800 }, { name: 'A', dailyWageRate: -1 }])('rejects invalid worker %j', (data) => expect(() => workers.createWorker(data)).toThrow());
  it('normalizes worker fields and filters inactive staff', () => {
    const w = workers.createWorker({ name: ' A ', dailyWageRate: 800, phone: ' 123 ' });
    expect(w).toMatchObject({ name: 'A', phone: '123', active: true });
    workers.updateWorker(w.id, { active: false });
    expect(workers.getWorkers({ activeOnly: true })).toEqual([]);
  });
  it.each([[0, 'UNPAID'], [400, 'PARTIAL'], [800, 'PAID']] as const)('payment %s yields %s', (amount, status) => {
    getDatabase().wageEntries = [{ id: 'wage', computedAmount: 800 } as never];
    expect(workers.recordWagePayment('wage', { paidAmount: amount })?.paidStatus).toBe(status);
  });
  it.each(['DAILY', 'MONTHLY', 'HOURLY'] as const)('calculates %s salaries from attendance and is idempotent', (wageType) => {
    const e = hr.createEmployee({ name: 'A', wageType, wageRate: wageType === 'MONTHLY' ? 26000 : 100, status: 'ACTIVE' } as never);
    hr.markAttendance({ employeeId: e.id, attendanceDate: date, status: 'PRESENT' });
    hr.markAttendance({ employeeId: e.id, attendanceDate: '2026-11-16', status: 'HALF_DAY' });
    const wage = hr.calculateSalariesForMonth(2026, 11)[0];
    expect(wage.grossSalary).toBe(wageType === 'DAILY' ? 150 : wageType === 'MONTHLY' ? 26000 : 1200);
    hr.calculateSalariesForMonth(2026, 11);
    expect(getDatabase().wages).toHaveLength(1);
  });
  it('updates attendance rather than inserting a duplicate and syncs field wages', () => {
    const e = hr.createEmployee({ name: 'A', wageType: 'DAILY', wageRate: 800, status: 'ACTIVE' } as never);
    hr.markAttendance({ employeeId: e.id, attendanceDate: date, status: 'PRESENT' });
    hr.markAttendance({ employeeId: e.id, attendanceDate: date, status: 'HALF_DAY' });
    expect(getDatabase().attendance).toHaveLength(1);
    expect(getDatabase().workerAttendances).toHaveLength(1);
    expect(getDatabase().wageEntries?.[0].computedAmount).toBe(400);
  });
});

describe('daily work lifecycle', () => {
  it('upserts one log per plot/date and preserves activities', () => {
    const plot = makePlot(); const log = daily.upsertDailyLog({ plotId: plot.id, date });
    daily.addWorkActivity(log.id, { activityType: 'OTHER', description: ' Water ' });
    const updated = daily.upsertDailyLog({ plotId: plot.id, date, notes: 'Updated' });
    expect(updated.id).toBe(log.id); expect(updated.activities).toHaveLength(1);
    expect(getDatabase().dailyLogs).toHaveLength(1);
  });
  it('enforces a reason for not-done work and supports done/pending', () => {
    const log = daily.upsertDailyLog({ plotId: makePlot().id, date });
    const { activity } = daily.addWorkActivity(log.id, { activityType: 'OTHER' });
    expect(() => daily.updateActivityStatus(activity.id, 'NOT_DONE', ' ')).toThrow(/reason/i);
    expect(daily.updateActivityStatus(activity.id, 'NOT_DONE', ' Rain ').dailyLog.status).toBe('NOT_DONE');
    expect(daily.updateActivityStatus(activity.id, 'DONE').dailyLog.status).toBe('COMPLETED');
    expect(daily.updateActivityStatus(activity.id, 'PENDING').dailyLog.status).toBe('PLANNED');
    expect(daily.deleteWorkActivity(activity.id).success).toBe(true);
    expect(daily.getDailyLogById(log.id)?.activities).toEqual([]);
  });
  it('rejects missing log/activity references', () => {
    expect(() => daily.addWorkActivity('missing', { activityType: 'OTHER' })).toThrow();
    expect(() => daily.updateActivityStatus('missing', 'DONE')).toThrow();
    expect(daily.deleteWorkActivity('missing').success).toBe(false);
  });
  it('transitions past work once and carries it forward without duplicates', () => {
    const log = daily.upsertDailyLog({ plotId: makePlot().id, date: '2026-11-14' });
    daily.addWorkActivity(log.id, { activityType: 'OTHER' });
    daily.autoTransitionPastPlannedActivities(date);
    const carriedIds = getDatabase().dailyLogs?.flatMap(l => l.activities.map(a => a.id));
    daily.autoTransitionPastPlannedActivities(date);
    expect(getDatabase().dailyLogs?.flatMap(l => l.activities.map(a => a.id))).toEqual(carriedIds);
    expect(daily.getDailyLogById(log.id)?.status).toBe('NOT_DONE');
  });
});

describe('crop finances', () => {
  it('calculates income, expense, profit, ROI and rollups', () => {
    const c = makeCycle();
    crop.addCropExpense({ cropCycleId: c.id, category: 'LABOR', amount: 100, date, description: 'Labor' });
    crop.addCropIncome({ cropCycleId: c.id, source: 'MARKET_SALE', quantitySold: 10, ratePerUnit: 30, unit: 'kg', date });
    expect(crop.getCropCycleFinancials(c.id)).toMatchObject({ totalExpenses: 100, totalIncome: 300, netProfitLoss: 200, roiPercent: 200 });
    expect(crop.getPlotFinancialRollup(c.plotId)).toMatchObject({ lifetimeExpenses: 100, lifetimeIncome: 300, lifetimeProfitLoss: 200 });
    expect(crop.getCropCycles({ plotId: c.plotId })).toHaveLength(1);
    expect(crop.getCropCycles({ status: 'CLOSED' })).toEqual([]);
  });
  it.each([0, -1])('rejects expense %s', (amount) => {
    expect(() => crop.addCropExpense({ cropCycleId: makeCycle().id, category: 'LABOR', amount, date, description: 'Labor' })).toThrow();
  });
  it('warns outside cycle dates and accepts grace-period boundaries', () => {
    const c = makeCycle();
    expect(crop.validateCropCycleDateRange(c, '2026-10-17').isWithinRange).toBe(true);
    expect(crop.validateCropCycleDateRange(c, '2026-10-16').isWithinRange).toBe(false);
    expect(crop.validateCropCycleDateRange(c, '2027-03-02').isWithinRange).toBe(true);
    expect(crop.validateCropCycleDateRange(c, '2027-03-03').isWithinRange).toBe(false);
  });
  it('handles zero finances and missing cycles without invalid percentages', () => {
    expect(crop.getCropCycleFinancials(makeCycle().id)).toMatchObject({ totalIncome: 0, totalExpenses: 0, roiPercent: 0, profitMarginPercent: 0 });
    expect(crop.getCropCycleFinancials('missing')).toBeNull();
  });
  it('deletes associated crop transactions', () => {
    const c = makeCycle(); crop.addCropExpense({ cropCycleId: c.id, category: 'LABOR', amount: 10, date, description: 'Labor' });
    expect(crop.deleteCropCycle(c.id)).toBe(true);
    expect(getDatabase().cropExpenses).toEqual([]);
  });
});

describe('petty cash and general expenses', () => {
  it('recalculates chronological balances with backdated entries and deletions', () => {
    expenses.topUpPettyCash({ amount: 1000, date });
    const exp = expenses.addExpense({ category: 'PETTY_CASH', amount: 100, date: '2026-11-16', description: 'Tea' });
    expenses.topUpPettyCash({ amount: 200, date: '2026-11-14' });
    expect(expenses.getPettyCashStatus()).toMatchObject({ currentBalance: 1100, totalInflow: 1200, totalOutflow: 100 });
    expenses.deleteExpense(exp.id);
    expect(expenses.getPettyCashStatus().currentBalance).toBe(1200);
  });
  it('aggregates multiple top-ups on a single day', () => {
    expenses.topUpPettyCash({ amount: 100, date }); expenses.topUpPettyCash({ amount: 50, date });
    expect(expenses.getPettyCashLedger()).toHaveLength(1);
    expect(expenses.getPettyCashStatus().currentBalance).toBe(150);
  });
  it.each([0, -10, NaN])('rejects invalid expense/top-up %s', (amount) => {
    expect(() => expenses.addExpense({ category: 'GENERAL', amount, date, description: 'Tea' })).toThrow();
    expect(() => expenses.topUpPettyCash({ amount, date })).toThrow();
  });
  it('syncs crop expenses idempotently and removes the link', () => {
    const e = expenses.addExpense({ category: 'GENERAL', amount: 100, date, description: 'Tools', cropCycleId: makeCycle().id });
    expenses.syncExpenseToCropExpense(e);
    expect(getDatabase().cropExpenses).toHaveLength(1);
    expenses.updateExpense(e.id, { amount: 200 });
    expect(getDatabase().cropExpenses?.[0].amount).toBe(200);
    expenses.updateExpense(e.id, { cropCycleId: null });
    expect(getDatabase().cropExpenses).toEqual([]);
  });
  it('summarizes expenses and applies date/category filters', () => {
    expenses.addExpense({ category: 'GENERAL', amount: 100, date, description: 'Tools' });
    expenses.addExpense({ category: 'PETTY_CASH', amount: 50, date: '2026-11-16', description: 'Tea' });
    expect(expenses.getExpenseSummaryReport()).toMatchObject({ totalExpenses: 150, pettyCashExpensesTotal: 50, generalExpensesTotal: 100 });
    expect(expenses.getExpenses({ startDate: date, endDate: date })).toHaveLength(1);
    expect(expenses.getExpenses({ category: 'GENERAL' })).toHaveLength(1);
  });
});

describe('machinery', () => {
  it('calculates and syncs operating costs; deletes synced expenses with logs', () => {
    const m = machines.createMachine({ name: ' Tractor ' });
    const c = makeCycle();
    const log = machines.addMachineUsageLog({ machineId: m.id, date, hoursUsed: 2, workDescription: 'Tilling', fuelCost: 100, maintenanceCost: 50, cropCycleId: c.id });
    expect(log.machineName).toBe('Tractor');
    expect(getDatabase().cropExpenses?.[0].amount).toBe(150);
    machines.syncMachineLogToCropExpense(log);
    expect(getDatabase().cropExpenses).toHaveLength(1);
    expect(machines.getMachineryReport()[0]).toBeDefined();
    expect(machines.deleteMachineUsageLog(log.id)).toBe(true);
    expect(getDatabase().cropExpenses).toEqual([]);
  });
  it.each([0, -1])('rejects invalid usage hours %s', (hoursUsed) => {
    const m = machines.createMachine({ name: 'Tractor' });
    expect(() => machines.addMachineUsageLog({ machineId: m.id, date, hoursUsed, workDescription: 'Tilling' })).toThrow();
  });
  it('rejects missing machine and empty names', () => {
    expect(() => machines.createMachine({ name: ' ' })).toThrow();
    expect(() => machines.addMachineUsageLog({ machineId: 'missing', date, hoursUsed: 1, workDescription: 'Tilling' })).toThrow();
  });
});

describe('operation item catalog', () => {
  it('generates sequential category codes and rejects case-insensitive duplicates', () => {
    const first = makeItem().item!;
    expect(first.itemCode).toBe('FERT-001');
    expect(makeItem().item?.itemCode).toBe('FERT-002');
    expect(makeItem({ itemCode: ' fert-001 ' }).success).toBe(false);
    expect(operations.isItemCodeUnique('FERT-001', first.id)).toBe(true);
    expect(operations.generateNextItemCode('Custom')).toBe('ITEM-001');
  });
  it('searches and filters by category/status', () => {
    makeItem(); makeItem({ category: 'Diesel & Fuel', name: 'Diesel', status: 'INACTIVE' });
    expect(operations.getOperationItems({ search: ' UREA ' })).toHaveLength(1);
    expect(operations.getOperationItems({ category: 'Diesel & Fuel', status: 'ACTIVE' })).toEqual([]);
    expect(operations.getOperationItemStats()).toMatchObject({ totalItems: 2, activeItems: 1, totalStockValuation: 400 });
  });
  it('reassigns codes and handles absent IDs', () => {
    const item = makeItem().item!;
    expect(operations.assignItemCode(item.id, ' custom-1 ').item?.itemCode).toBe('CUSTOM-1');
    expect(operations.assignItemCode(item.id, ' ').success).toBe(false);
    expect(operations.updateOperationItem('missing', {}).success).toBe(false);
    expect(operations.deleteOperationItem(item.id)).toBe(true);
    expect(operations.deleteOperationItem(item.id)).toBe(false);
  });
});

describe('inventory, procurement and sales', () => {
  it.each(['feed', 'medicine', 'vaccine'] as const)('computes %s stock, valuation and alerts', (type) => {
    const db = getDatabase();
    db[`${type}Inventory`] = [{ id: 'stock', openingStock: 10, purchasedQty: 5, usedQty: 3, wastageQty: 2, costPerUnit: 20, alertLevel: 5 } as never];
    expect(inventory.getInventory(type)[0]).toMatchObject({ closingStock: 10, totalCost: 200, status: 'ADEQUATE' });
    expect(inventory.updateInventoryRecord(type, 'stock', { usedQty: 8 })?.status).toBe('LOW_STOCK');
    expect(inventory.getAllInventoryAlerts()).toHaveLength(1);
    expect(inventory.updateInventoryRecord(type, 'stock', { usedQty: 13 })?.status).toBe('OUT_OF_STOCK');
  });
  it.each(['feed', 'medicine', 'vaccine', 'other'])('creates, updates and removes %s vouchers', (type) => {
    const v = vouchers.createVoucher(type, { quantity: 10, cost: 100, amount: 100, purchaseDate: date, voucherDate: date });
    expect(vouchers.getVoucherById(type, v.id)).toBeDefined();
    expect(getDatabase().godownItems).toHaveLength(1);
    expect(vouchers.updateVoucher(type, v.id, { notes: 'Updated' })?.notes).toBe('Updated');
    expect(vouchers.deleteVoucher(type, v.id)).toBe(true);
    expect(vouchers.getVouchers(type)).toEqual([]);
  });
  it('issues stock to fertilizer logs and rejects overspending/invalid quantities', () => {
    const item = godown.addGodownItem({ name: 'Urea', category: 'Fertilizer', totalReceivedQuantity: 10, availableQuantity: 10, ratePerUnit: 20, minStockAlert: 2, unit: 'kg', receivedDate: date } as never);
    const issue = (quantity: number) => godown.issueGodownItemToMenu({ godownItemId: item.id, destinationMenu: 'Fertilizer', quantity, date });
    expect(() => issue(11)).toThrow(/Insufficient/);
    expect(() => issue(0)).toThrow(); expect(() => issue(NaN)).toThrow();
    expect(issue(3).updatedItem.availableQuantity).toBe(7);
    expect(getDatabase().fertilizerLogs[0].cost).toBe(60);
    expect(godown.getGodownStats().totalValuation).toBe(140);
  });
  it('groups invoice lines, recalculates edits and computes revenue', () => {
    const s = sales.createMultiItemSale('crop', { dateOfSale: date, buyerName: 'Customer', items: [{ itemName: 'Tomato', quantity: 2, pricePerUnit: 30 }, { itemName: 'Coconut', quantity: 3, pricePerUnit: 10 }] });
    expect(sales.getSalesByInvoiceGroup(s.invoiceGroupId).totalAmount).toBe(90);
    expect(sales.calculateSalesAnalytics().kpis).toMatchObject({ totalRevenue: 90, totalInvoices: 1, avgOrderValue: 90 });
    expect(sales.updateSale('crop', s.items[0].id, { quantity: 4 })?.totalAmount).toBe(120);
    sales.deleteSale('crop', s.items[1].id);
    expect(sales.getOtherSales()).toHaveLength(1);
  });
});

describe('financial reporting', () => {
  it('balances profit and loss from dated purchases and sales', () => {
    getDatabase().feedPurchases = [{ cost: 100, purchaseDate: date } as never];
    getDatabase().otherSales = [{ totalAmount: 300, dateOfSale: date, itemName: 'Tomato' } as never];
    const p = generatePnLStatement('2026-11-01', '2026-11-30');
    expect(p).toMatchObject({ netProfit: 200, netLoss: 0, balancedTotal: 300 });
    expect(p.debitItems.reduce((s, i) => s + i.amount, 0)).toBe(p.creditItems.reduce((s, i) => s + i.amount, 0));
    expect(generatePnLStatement('2027-01-01', '2027-01-31').summary.totalRevenue).toBe(0);
  });
  it('handles a loss and empty reports', () => {
    expect(generatePnLStatement().balancedTotal).toBe(0);
    getDatabase().feedPurchases = [{ cost: 100, purchaseDate: date } as never];
    expect(generatePnLStatement()).toMatchObject({ netLoss: 100, netProfit: 0 });
  });
  it('generates empty consolidated report and CSV', () => {
    expect(getConsolidatedReport().kpis).toMatchObject({ totalIncome: 0, totalExpenses: 0, netProfitLoss: 0 });
    expect(generateConsolidatedReportCsv()).toContain('Date');
  });
});
