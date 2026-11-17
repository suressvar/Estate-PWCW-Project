import { describe, expect, it } from 'vitest';
import { getDatabase } from '../src/lib/db-storage';
import * as hr from '../src/lib/hr-data';
import * as workers from '../src/lib/worker-data';
import * as master from '../src/lib/master-data';
import * as cycles from '../src/lib/crop-cycle-data';
import * as machines from '../src/lib/machinery-data';
import * as accounting from '../src/lib/accounting-data';
import * as godown from '../src/lib/godown-data';
import * as daily from '../src/lib/daily-log-data';

const date = '2026-11-16';
const employee = (wageType: 'DAILY' | 'HOURLY' | 'MONTHLY' = 'DAILY', wageRate = 600) => hr.createEmployee({ name: 'White box worker', wageType, wageRate, status: 'ACTIVE' });
const plot = () => master.createPlot({ name: 'White box plot', location: 'Test', areaAcres: 5, status: 'ACTIVE' });
const cycle = (plotId = plot().id) => cycles.createCropCycle({ plotId, cropName: 'Tomato', sowingDate: '2026-11-01', expectedHarvestDate: '2027-01-31' });
const machine = () => machines.createMachine({ name: 'White box tractor', type: 'TRACTOR', active: true });

describe('WB payroll control flow and cross-module invariants', () => {
  it('keeps hourly payroll and daily worker projections consistent', () => {
    const person = employee('HOURLY', 100);
    expect(workers.getWorkers().find(row => row.id === person.id)?.dailyWageRate).toBe(800);
    hr.markAttendance({ employeeId: person.id, attendanceDate: date, status: 'PRESENT' });
    expect(getDatabase().wageEntries?.[0].computedAmount).toBe(800);
    expect(hr.calculateSalariesForMonth(2026, 11)[0].grossSalary).toBe(800);
  });
  it('rejects attendance for a missing employee without creating orphan records', () => {
    expect(() => hr.markAttendance({ employeeId: 'missing', attendanceDate: date, status: 'PRESENT' })).toThrow();
    expect(getDatabase().attendance).toEqual([]); expect(getDatabase().wageEntries).toEqual([]);
  });
  it.each(['hr', 'worker'] as const)('%s attendance cannot reduce earned wages below money already paid', source => {
    const person = employee(); const result = workers.upsertWorkerAttendanceAndWage({ workerId: person.id, date, status: 'PRESENT' });
    workers.recordWagePayment(result.wage.id, { paidAmount: 400 });
    const original = structuredClone(getDatabase());
    expect(() => source === 'hr' ? hr.markAttendance({ employeeId: person.id, attendanceDate: date, status: 'ABSENT' }) : workers.upsertWorkerAttendanceAndWage({ workerId: person.id, date, status: 'ABSENT' })).toThrow();
    expect(getDatabase()).toEqual(original);
  });
  it('rejects payments exceeding the computed wage', () => {
    const result = workers.upsertWorkerAttendanceAndWage({ workerId: employee().id, date, status: 'PRESENT' });
    expect(() => workers.recordWagePayment(result.wage.id, { paidAmount: 601 })).toThrow();
    expect(getDatabase().wageEntries?.[0].paidAmount).toBe(0);
  });
  it('updates linked crop costs and payment status through the HR attendance path', () => {
    const person = employee(); const crop = cycle();
    const result = workers.upsertWorkerAttendanceAndWage({ workerId: person.id, date, status: 'HALF_DAY', cropCycleId: crop.id });
    workers.recordWagePayment(result.wage.id, { paidAmount: 300 });
    hr.markAttendance({ employeeId: person.id, attendanceDate: date, status: 'PRESENT' });
    expect(getDatabase().wageEntries?.[0]).toMatchObject({ computedAmount: 600, paidStatus: 'PARTIAL' });
    expect(getDatabase().cropExpenses?.[0].amount).toBe(600);
  });
  it('removes mirrored crop expenses when deleting an unpaid worker', () => {
    const person = employee(); const crop = cycle();
    workers.upsertWorkerAttendanceAndWage({ workerId: person.id, date, status: 'PRESENT', cropCycleId: crop.id });
    expect(workers.deleteWorker(person.id)).toBe(true);
    expect(getDatabase().cropExpenses).toEqual([]);
  });
});

describe('WB referential integrity and mutation branches', () => {
  it('retains a plot referenced by an existing crop cycle', () => {
    const land = plot(); cycle(land.id);
    expect(() => master.deletePlot(land.id)).toThrow();
    expect(master.getPlots()).toHaveLength(1);
  });
  it('rejects a crop cycle being linked to a different plot in an attendance write', () => {
    const person = employee();
    expect(() => workers.upsertWorkerAttendanceAndWage({ workerId: person.id, date, status: 'PRESENT', cropCycleId: 'missing' })).toThrow();
    expect(getDatabase().workerAttendances).toEqual([]);
  });
  it('rejects machinery references whose plot and cycle disagree', () => {
    const first = plot(), second = plot(), crop = cycle(first.id), equipment = machine();
    expect(() => machines.addMachineUsageLog({ machineId: equipment.id, date, plotId: second.id, cropCycleId: crop.id, hoursUsed: 2, workDescription: 'Tilling' })).toThrow();
    expect(getDatabase().machineUsageLogs).toEqual([]);
  });
  it('validates dates and machine references when updating usage', () => {
    const equipment = machine(); const entry = machines.addMachineUsageLog({ machineId: equipment.id, date, hoursUsed: 2, workDescription: 'Tilling' });
    expect(() => machines.updateMachineUsageLog(entry.id, { date: '2026-02-30' })).toThrow();
    expect(() => machines.updateMachineUsageLog(entry.id, { machineId: 'missing' })).toThrow();
  });
  it('validates machine names during edits', () => expect(() => machines.updateMachine(machine().id, { name: ' ' })).toThrow());
  it('rejects ledger accounts with missing parent groups', () => {
    expect(() => accounting.createExpenseLedger({ ledgerName: 'Inputs', groupId: 'missing' })).toThrow();
    expect(getDatabase().expenseLedgers).toEqual([]);
  });
  it.each(['groupName', 'pnlSide'] as const)('validates ledger group %s', field => {
    expect(() => accounting.createLedgerGroup({ groupName: 'Inputs', groupType: 'EXPENSE', pnlSide: 'DEBIT', description: '', [field]: field === 'groupName' ? ' ' : 'INVALID' } as never)).toThrow();
  });
  it('validates an edited actual harvest date', () => expect(() => cycles.updateCropCycle(cycle().id, { actualHarvestDate: '2026-02-30' })).toThrow());
  it('validates daily activity status instead of silently accepting unknown transitions', () => {
    const log = daily.upsertDailyLog({ plotId: plot().id, date, createdBy: 'Tester', status: 'PLANNED' });
    const activity = daily.addWorkActivity(log.id, { activityType: 'WEEDING' }).activity;
    expect(() => daily.updateActivityStatus(activity.id, 'UNKNOWN' as never)).toThrow();
    expect(daily.getDailyLogById(log.id)?.activities[0].completedFlag).toBe(false);
  });
});

describe('WB stock arithmetic boundaries', () => {
  const item = () => godown.addGodownItem({ name: 'Precise stock', category: 'Fertilizer', totalReceivedQuantity: 1, availableQuantity: 1, ratePerUnit: 1000, unit: 'kg', receivedDate: date, minStockAlert: 0, location: 'Test' });
  it('deducts small fractional stock issues instead of rounding the stock back up', () => {
    const result = godown.issueGodownItemToMenu({ godownItemId: item().id, destinationMenu: 'Fertilizer', quantity: 0.001, date });
    expect(result.updatedItem.availableQuantity).toBe(0.999);
  });
  it.each([{ date: '2026-02-30' }, { destinationMenu: 'unknown' }])('rejects invalid stock dispatch %j before changing balances', changes => {
    const stock = item(); const original = structuredClone(getDatabase());
    expect(() => godown.issueGodownItemToMenu({ godownItemId: stock.id, destinationMenu: 'Fertilizer', quantity: 0.1, date, ...changes })).toThrow();
    expect(getDatabase()).toEqual(original);
  });
  it('does not invent a second purchase voucher when dispatching existing general stock', () => {
    const stock = item();
    godown.issueGodownItemToMenu({ godownItemId: stock.id, destinationMenu: 'General Purchases / Plot Ops', quantity: 0.1, date });
    expect(getDatabase().generalPurchaseLogs).toEqual([]);
    expect(getDatabase().godownMovements?.filter(row => row.movementType === 'ISSUE_TO_MENU')).toHaveLength(1);
  });
});
