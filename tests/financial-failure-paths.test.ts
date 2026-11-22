import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestApi } from './helpers/api';
import { seedRecords } from './helpers/seed';
import { getDatabase, saveDatabase } from '../src/lib/db-storage';
import * as expenses from '../src/lib/expenses-data';
import * as workers from '../src/lib/worker-data';
import * as hr from '../src/lib/hr-data';
import { POST as calculate } from '../src/app/api/salary/calculate/route';
import { POST as mark } from '../src/app/api/attendance/mark/route';
import { POST as bulk } from '../src/app/api/attendance/bulk/route';
import { POST as leave } from '../src/app/api/leaves/route';
import { POST as expense } from '../src/app/api/expenses/route';
import { POST as petty } from '../src/app/api/expenses/petty-cash/route';
import { NextRequest } from 'next/server';

afterEach(() => vi.restoreAllMocks());

describe('Malformed financial and attendance requests', () => {
  for (const [name, handler] of Object.entries({ calculate, mark, bulk, leave, expense, petty })) {
    it.each(['{', 'null', '[]'])(`rejects ${name} malformed or incomplete body %s without writes`, async body => {
      const before = structuredClone(getDatabase());
      const response = await handler(new NextRequest('http://localhost/api/test', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }));
      expect(response.status).toBe(400); expect(await response.json()).toHaveProperty('error'); expect(getDatabase()).toEqual(before);
    });
  }
});

describe('Petty cash and worker payment atomicity', () => {
  it('top-ups, spends, recalculates and returns the same cash balance', async () => {
    const topUp = await requestApi('/api/expenses/petty-cash', 'POST', { amount: 100, date: '2026-11-01', description: 'Opening cash' });
    expect(topUp.status).toBe(201);
    expect((await requestApi('/api/expenses', 'POST', { amount: 30, category: 'PETTY_CASH', date: '2026-11-01', description: 'Transport' })).status).toBe(201);
    expect((await (await requestApi('/api/expenses/petty-cash?statusOnly=true')).json()).data.currentBalance).toBe(70);
    expect((await requestApi('/api/expenses/petty-cash', 'POST', { action: 'recalculate' })).status).toBe(200);
    const response = await requestApi('/api/expenses/petty-cash');
    expect(response.status).toBe(200); expect((await response.json()).data.status.currentBalance).toBe(70);
  });

  it.each([{ amount: 0 }, { amount: -1 }, { amount: 'bad' }, { date: '2026-02-30' }])('rejects invalid top-up %j', async patch => {
    const before = structuredClone(getDatabase());
    expect((await requestApi('/api/expenses/petty-cash', 'POST', { amount: 100, date: '2026-11-01', notes: 'Cash', ...patch })).status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it.each(['topup', 'recalculate'])('rolls back cash ledger when %s response fails after mutation', async operation => {
    expenses.topUpPettyCash({ amount: 100, date: '2026-11-01', notes: 'Cash' });
    const before = structuredClone(getDatabase());
    // Simulate a mutation followed by a failed read while building the response.
    if (operation === 'recalculate') vi.spyOn(expenses, 'recalculatePettyCashLedger').mockImplementationOnce(() => { getDatabase().pettyCashLedger!.splice(0); });
    vi.spyOn(expenses, 'getPettyCashStatus').mockImplementationOnce(() => { throw new Error('late balance read failed'); });
    const response = await requestApi('/api/expenses/petty-cash', 'POST', operation === 'topup' ? { amount: 20, date: '2026-11-02', description: 'More cash' } : { action: 'recalculate' });
    expect(response.status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it('returns structured cash read failures for non-Error exceptions', async () => {
    vi.spyOn(expenses, 'getPettyCashStatus').mockImplementationOnce(() => { throw 'unavailable'; });
    const response = await requestApi('/api/expenses/petty-cash?statusOnly=true');
    expect(response.status).toBe(500); expect((await response.json()).error).toBe('The request could not be completed.');
  });

  it('rolls back worker payment if subsequent crop sync fails', async () => {
    seedRecords(); const wage = getDatabase().wageEntries![0], before = structuredClone(getDatabase());
    vi.spyOn(workers, 'syncWageToCropExpense').mockImplementationOnce(() => { throw new Error('late crop sync failure'); });
    expect((await requestApi('/api/workers/wages', 'POST', { wageId: wage.id, paidAmount: 10, paidDate: wage.date })).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  it.each([{ paidAmount: -1 }, { paidAmount: 'bad' }, { paidAmount: 100000 }, { paidDate: '2026-02-30' }])('rejects invalid worker payment %j', async patch => {
    seedRecords(); const wage = getDatabase().wageEntries![0], before = structuredClone(getDatabase());
    expect((await requestApi('/api/workers/wages', 'POST', { wageId: wage.id, paidAmount: 10, paidDate: wage.date, ...patch })).status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it('records a worker payment and filters the wage register', async () => {
    const { employee } = seedRecords(); const wage = getDatabase().wageEntries![0];
    const response = await requestApi('/api/workers/wages', 'POST', { wageId: wage.id, paidAmount: 10, paidDate: wage.date, paymentNotes: 'Part payment' });
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ paidAmount: 10 });
    const register = await requestApi(`/api/workers/wages?workerId=${employee.id}&startDate=${wage.date}&endDate=${wage.date}&paidStatus=PARTIAL`);
    expect(register.status).toBe(200); expect((await register.json()).entries).toHaveLength(1);
  });

  it('requires an existing worker wage ID', async () => {
    expect((await requestApi('/api/workers/wages', 'POST', {})).status).toBe(400);
    expect((await requestApi('/api/workers/wages', 'POST', { wageId: 'missing', paidAmount: 10, paidDate: '2026-11-01' })).status).toBe(404);
  });
});

describe('Leave API rejection and rollback', () => {
  it.each(['APPROVED', 'PENDING', 'REJECTED'])('creates, updates and deletes %s leave', async status => {
    const { employee } = seedRecords();
    const response = await requestApi('/api/leaves', 'POST', { employeeId: employee.id, fromDate: '2026-11-03', toDate: '2026-11-04', leaveType: 'CASUAL', status, reason: 'Family' });
    expect(response.status).toBe(201); const item = await response.json();
    expect((await requestApi('/api/leaves')).status).toBe(200);
    expect((await requestApi(`/api/leaves/${item.id}`, 'PUT', { status: 'REJECTED' })).status).toBe(200);
    expect((await requestApi(`/api/leaves/${item.id}`, 'DELETE')).status).toBe(200);
    expect(getDatabase().leaves).toHaveLength(0);
  });

  it.each([{ employeeId: 'missing' }, { fromDate: '2026-02-30' }, { toDate: '2026-11-01' }, { leaveType: 'BAD' }, { status: 'BAD' }, { toDate: '2028-11-04' }])('rejects invalid leave %j', async patch => {
    const { employee } = seedRecords(); const before = structuredClone(getDatabase());
    expect((await requestApi('/api/leaves', 'POST', { employeeId: employee.id, fromDate: '2026-11-03', toDate: '2026-11-04', leaveType: 'CASUAL', status: 'APPROVED', ...patch })).status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it.each(['PUT', 'DELETE'])('handles missing leave for %s', async method => {
    expect((await requestApi('/api/leaves/missing', method, method === 'PUT' ? { status: 'REJECTED' } : undefined)).status).toBe(404);
  });

  it.each(['POST', 'PUT', 'DELETE'])('rolls back leave and attendance after %s persistence failure', async method => {
    const { employee } = seedRecords();
    const body = { employeeId: employee.id, fromDate: '2026-11-03', toDate: '2026-11-04', leaveType: 'CASUAL' as const, status: 'APPROVED' as const, totalDays: 2 };
    const existing = hr.createLeave(body); const before = structuredClone(getDatabase());
    vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('disk full'); });
    expect((await requestApi(`/api/leaves${method === 'POST' ? '' : `/${existing.id}`}`, method, method === 'POST' ? { ...body, fromDate: '2026-11-05', toDate: '2026-11-06' } : method === 'PUT' ? { status: 'REJECTED' } : undefined)).status).toBe(method === 'DELETE' ? 409 : 400);
    expect(getDatabase()).toEqual(before);
  });
});

describe('Worker attendance API boundaries', () => {
  it.each([{ workerId: '' }, { date: '' }, { status: '' }, { workerId: 'missing' }, { date: '2026-02-30' }, { status: 'BAD' }, { checkInTime: '25:00' }])('rejects invalid worker attendance %j', async patch => {
    const { employee } = seedRecords(); const before = structuredClone(getDatabase());
    const response = await requestApi('/api/workers/attendance', 'POST', { workerId: employee.id, date: '2026-11-05', status: 'PRESENT', ...patch });
    expect(response.status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it('records clock times and reads the daily sheet', async () => {
    const { employee } = seedRecords();
    const response = await requestApi('/api/workers/attendance', 'POST', { workerId: employee.id, date: '2026-11-05', status: 'HALF_DAY', checkInTime: '08:00', checkOutTime: '12:00' });
    expect(response.status).toBe(200); expect((await response.json()).attendance).toMatchObject({ checkInTime: '08:00', checkOutTime: '12:00' });
    expect((await requestApi('/api/workers/attendance?date=2026-11-05')).status).toBe(200);
    expect((await requestApi('/api/workers/attendance')).status).toBe(200);
  });

  it('restores attendance and wages on a disk failure', async () => {
    const { employee } = seedRecords(); const before = structuredClone(getDatabase());
    vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('disk full'); });
    expect((await requestApi('/api/workers/attendance', 'POST', { workerId: employee.id, date: '2026-11-05', status: 'PRESENT' })).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  it('returns a useful fallback for an empty error message', async () => {
    vi.spyOn(workers, 'upsertWorkerAttendanceAndWage').mockImplementationOnce(() => { throw new Error(''); });
    const response = await requestApi('/api/workers/attendance', 'POST', { workerId: 'worker', date: '2026-11-05', status: 'PRESENT' });
    expect(response.status).toBe(400); expect((await response.json()).error).toBe('Failed to update attendance');
  });
});

describe('Crop income numeric safety', () => {
  it.each([{ quantitySold: true }, { ratePerUnit: true }, { quantitySold: 1e15, ratePerUnit: 1e15 }, { unit: '' }])('rejects unsafe income %j without writes', async patch => {
    const { cycle, date } = seedRecords(); const before = structuredClone(getDatabase());
    expect((await requestApi(`/api/crop-cycles/${cycle.id}/incomes`, 'POST', { source: 'MARKET_SALE', quantitySold: 2, ratePerUnit: 20, unit: 'kg', date, ...patch })).status).toBe(400); expect(getDatabase()).toEqual(before);
  });
});
