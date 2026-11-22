import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestApi } from './helpers/api';
import { seedRecords } from './helpers/seed';
import { getDatabase, saveDatabase } from '../src/lib/db-storage';
import * as cycles from '../src/lib/crop-cycle-data';
import * as hr from '../src/lib/hr-data';
import * as expenses from '../src/lib/expenses-data';

afterEach(() => vi.restoreAllMocks());

describe('Attendance and payroll API boundaries', () => {
  it.each([
    { attendanceDate: '2026-02-30', status: 'PRESENT' },
    { attendanceDate: '2026-11-01', status: 'INVALID' },
    { attendanceDate: '', status: 'PRESENT' },
    { attendanceDate: '2026-11-01' },
  ])('rejects invalid bulk input even with no employees: %j', async body => {
    const before = structuredClone(getDatabase());
    expect((await requestApi('/api/attendance/bulk', 'POST', body)).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  it.each(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE', 'HOLIDAY'])('marks and reads %s through the API', async status => {
    const { employee } = seedRecords();
    const response = await requestApi('/api/attendance/mark', 'POST', { employeeId: employee.id, attendanceDate: '2026-11-01', status });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ employeeId: employee.id, status });
    const grid = await requestApi('/api/attendance/grid?year=2026&month=11');
    expect(grid.status).toBe(200);
    expect((await grid.json()).records).toEqual(expect.arrayContaining([expect.objectContaining({ employeeId: employee.id, status })]));
    expect((await requestApi('/api/attendance/summary?year=2026&month=11&workingDays=26')).status).toBe(200);
  });

  it.each([{ employeeId: 'missing' }, { attendanceDate: '2026-02-30' }, { status: 'BAD' }, { checkInTime: '25:00' }, { checkInTime: '10:00', checkOutTime: '09:00' }])('rejects invalid individual attendance without mutation: %j', async patch => {
    const { employee } = seedRecords(); const before = structuredClone(getDatabase());
    const response = await requestApi('/api/attendance/mark', 'POST', { employeeId: employee.id, attendanceDate: '2026-11-01', status: 'PRESENT', ...patch });
    expect(response.status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it('rolls back attendance and computed worker wages if persistence fails', async () => {
    const { employee } = seedRecords(); const before = structuredClone(getDatabase());
    vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('disk full'); });
    expect((await requestApi('/api/attendance/mark', 'POST', { employeeId: employee.id, attendanceDate: '2026-11-01', status: 'PRESENT' })).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  it('rolls back earlier employees when a later bulk write fails', async () => {
    const { role } = seedRecords();
    hr.createEmployee({ name: 'Second worker', roleId: role.id, wageType: 'DAILY', wageRate: 300, status: 'ACTIVE' });
    const before = structuredClone(getDatabase());
    let calls = 0;
    vi.mocked(saveDatabase).mockImplementation(() => { if (++calls === 4) throw new Error('late bulk write failure'); });
    expect((await requestApi('/api/attendance/bulk', 'POST', { attendanceDate: '2026-11-02', status: 'PRESENT' })).status).toBe(400);
    expect(calls).toBeGreaterThanOrEqual(4); expect(getDatabase()).toEqual(before);
  });

  it('accepts valid empty bulk operation', async () => {
    const response = await requestApi('/api/attendance/bulk', 'POST', { attendanceDate: '2026-11-01', status: 'PRESENT' });
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ success: true, count: 0 });
  });

  it.each([0, -1, 32, 1.5, 'bad', '', null, true])('rejects explicit invalid workingDays %j without recalculating', async workingDays => {
    seedRecords(); const before = structuredClone(getDatabase());
    expect((await requestApi('/api/salary/calculate', 'POST', { year: 2026, month: 11, workingDays })).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  it.each([{ year: 0 }, { year: 10000 }, { year: true }, { month: 13 }, { month: 1.5 }, { month: true }, { month: 'bad' }])('rejects invalid salary period %j', async patch => {
    const before = structuredClone(getDatabase());
    expect((await requestApi('/api/salary/calculate', 'POST', { year: 2026, month: 11, ...patch })).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  for (const endpoint of ['/api/attendance/grid', '/api/attendance/summary', '/api/salary/calculate']) {
    it.each(['year=0', 'year=2026junk', 'month=0', 'month=13', 'month=1.5', 'month=11junk', 'month='])('rejects malformed period query at '+endpoint+'?%s', async query => {
      expect((await requestApi(`${endpoint}?${query}`)).status).toBe(400);
    });
    it('uses current period only when omitted: '+endpoint, async () => {
      expect((await requestApi(endpoint)).status).toBe(200);
    });
  }

  it('rejects invalid summary working days', async () => {
    expect((await requestApi('/api/attendance/summary?workingDays=0')).status).toBe(400);
  });

  it('calculates, adjusts, pays and preserves paid salary on recalculation', async () => {
    const { date } = seedRecords(); const year = Number(date.slice(0, 4)), month = Number(date.slice(5, 7));
    const computed = await requestApi('/api/salary/calculate', 'POST', { year, month });
    expect(computed.status).toBe(200); const [wage] = await computed.json();
    expect((await requestApi(`/api/salary/pay/${wage.id}`, 'PUT', { bonus: 20, deductions: 10, notes: 'Reviewed' })).status).toBe(200);
    const response = await requestApi(`/api/salary/pay/${wage.id}`, 'POST', { paymentDate: date, paymentMode: 'BANK', paymentReference: 'PAY-1' });
    expect(response.status).toBe(200); const paid = await response.json();
    expect(paid).toMatchObject({ status: 'PAID', netSalary: wage.grossSalary + 10 });
    expect((await requestApi(`/api/salary/pay/${wage.id}`, 'PUT', { bonus: 99 })).status).toBe(400);
    await requestApi('/api/salary/calculate', 'POST', { year, month });
    expect(getDatabase().wages.find(w => w.id === wage.id)).toEqual(paid);
  });

  it.each([{ bonus: -1 }, { deductions: 'bad' }, { grossSalary: 999 }, { employeeId: 'other' }, { status: 'PAID' }, { id: 'other' }])('rejects salary tampering %j', async patch => {
    seedRecords(); const id = getDatabase().wages[0].id, before = structuredClone(getDatabase());
    expect((await requestApi(`/api/salary/pay/${id}`, 'PUT', patch)).status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it.each(['POST', 'PUT'])('returns missing wage on %s', async method => {
    expect((await requestApi('/api/salary/pay/missing', method, method === 'POST' ? { paymentDate: '2026-11-01', paymentMode: 'BANK' } : {})).status).toBe(404);
  });

  it.each([{ paymentDate: '2026-02-30', paymentMode: 'BANK' }, { paymentDate: '2026-11-01', paymentMode: '' }])('rejects invalid payment %j', async body => {
    seedRecords(); const id = getDatabase().wages[0].id, before = structuredClone(getDatabase());
    expect((await requestApi(`/api/salary/pay/${id}`, 'POST', body)).status).toBe(400); expect(getDatabase()).toEqual(before);
  });

  it.each(['calculate', 'adjust', 'pay'])('restores salary state on failed %s persistence', async operation => {
    const { date } = seedRecords(); const id = getDatabase().wages[0].id, before = structuredClone(getDatabase());
    vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('disk full'); });
    const response = operation === 'calculate'
      ? await requestApi('/api/salary/calculate', 'POST', { year: Number(date.slice(0, 4)), month: Number(date.slice(5, 7)) })
      : await requestApi(`/api/salary/pay/${id}`, operation === 'pay' ? 'POST' : 'PUT', operation === 'pay' ? { paymentDate: date, paymentMode: 'BANK' } : { bonus: 100 });
    expect(response.status).toBe(400); expect(getDatabase()).toEqual(before);
  });
});

describe('Crop finance request isolation and rollback', () => {
  for (const kind of ['expenses', 'incomes'] as const) {
    const payload = (date: string) => kind === 'expenses' ? { category: 'SEEDS', amount: 20, date, description: 'Seeds' } : { source: 'MARKET_SALE', quantitySold: 2, ratePerUnit: 20, unit: 'kg', date };
    const rows = () => kind === 'expenses' ? getDatabase().cropExpenses! : getDatabase().cropIncomes!;
    const key = kind === 'expenses' ? 'expenseId' : 'incomeId';

    it(`creates and deletes ${kind} with updated financials`, async () => {
      const { cycle, date } = seedRecords();
      const response = await requestApi(`/api/crop-cycles/${cycle.id}/${kind}`, 'POST', payload(date));
      expect(response.status).toBe(201); expect(await response.json()).toHaveProperty('financials');
      const id = rows()[0].id;
      expect((await requestApi(`/api/crop-cycles/${cycle.id}/${kind}?${key}=${id}`, 'DELETE')).status).toBe(200);
      expect(rows().some(row => row.id === id)).toBe(false);
    });

    it(`prevents deletion through a different crop's ${kind} endpoint`, async () => {
      const { plot, date } = seedRecords();
      const other = cycles.createCropCycle({ plotId: plot.id, cropName: 'Other cycle', sowingDate: date, expectedHarvestDate: '2027-12-31' });
      const before = structuredClone(getDatabase());
      expect((await requestApi(`/api/crop-cycles/${other.id}/${kind}?${key}=${rows()[0].id}`, 'DELETE')).status).toBe(404);
      expect(getDatabase()).toEqual(before);
    });

    it.each(['missing-id', 'missing-record'])(`handles %s on ${kind} delete`, async scenario => {
      const { cycle } = seedRecords(); const before = structuredClone(getDatabase());
      expect((await requestApi(`/api/crop-cycles/${cycle.id}/${kind}${scenario === 'missing-record' ? `?${key}=missing` : ''}`, 'DELETE')).status).toBe(scenario === 'missing-id' ? 400 : 404);
      expect(getDatabase()).toEqual(before);
    });

    it(`rolls back ${kind} when financial response generation fails after insertion`, async () => {
      const { cycle, date } = seedRecords(); const before = structuredClone(getDatabase());
      vi.spyOn(cycles, 'getCropCycleFinancials').mockImplementationOnce(() => { throw new Error('late financial failure'); });
      expect((await requestApi(`/api/crop-cycles/${cycle.id}/${kind}`, 'POST', payload(date))).status).toBeGreaterThanOrEqual(400);
      expect(getDatabase()).toEqual(before);
    });

    it.each(['POST', 'DELETE'])(`rolls back ${kind} on %s disk failure`, async method => {
      const { cycle, date } = seedRecords(); const id = rows()[0].id, before = structuredClone(getDatabase());
      vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('disk full'); });
      expect((await requestApi(`/api/crop-cycles/${cycle.id}/${kind}${method === 'DELETE' ? `?${key}=${id}` : ''}`, method, method === 'POST' ? payload(date) : undefined)).status).toBeGreaterThanOrEqual(400);
      expect(getDatabase()).toEqual(before);
    });

    it.each([{ date: '2026-02-30' }, { amount: -1 }, { category: 'BAD', source: 'BAD' }])(`rejects invalid ${kind} input %j`, async patch => {
      const { cycle, date } = seedRecords(); const before = structuredClone(getDatabase());
      expect((await requestApi(`/api/crop-cycles/${cycle.id}/${kind}`, 'POST', { ...payload(date), ...patch })).status).toBe(400);
      expect(getDatabase()).toEqual(before);
    });
  }

  it('rolls back operation sync if its financial response fails', async () => {
    const { cycle } = seedRecords(); const before = structuredClone(getDatabase());
    vi.spyOn(cycles, 'syncOperationsToCropCycle').mockImplementationOnce(() => {
      getDatabase().cropExpenses!.splice(0); return { synced: 1 } as unknown as ReturnType<typeof cycles.syncOperationsToCropCycle>;
    });
    vi.spyOn(cycles, 'getCropCycleFinancials').mockImplementationOnce(() => { throw new Error('late failure'); });
    expect((await requestApi(`/api/crop-cycles/${cycle.id}/sync-operations`, 'POST')).status).toBe(500);
    expect(getDatabase()).toEqual(before);
  });
});

describe('General expense API failure branches', () => {
  it('creates, filters, summarizes, updates and deletes a linked petty cash expense', async () => {
    const { cycle, plot, date } = seedRecords();
    const response = await requestApi('/api/expenses', 'POST', { category: 'PETTY_CASH', amount: 30, date, description: 'Transport', plotId: plot.id, cropCycleId: cycle.id });
    expect(response.status).toBe(201); const { data } = await response.json();
    const filtered = await requestApi(`/api/expenses?category=PETTY_CASH&plotId=${plot.id}&cropCycleId=${cycle.id}&startDate=${date}&endDate=${date}`);
    expect((await filtered.json()).data).toEqual([data]);
    expect((await requestApi('/api/expenses?summary=true')).status).toBe(200);
    expect((await requestApi('/api/expenses', 'PUT', { id: data.id, amount: 40 })).status).toBe(200);
    expect(getDatabase().cropExpenses!.find(e => e.sourceRefId === `expense_${data.id}`)?.amount).toBe(40);
    expect((await requestApi(`/api/expenses?id=${data.id}`, 'DELETE')).status).toBe(200);
    expect(getDatabase().cropExpenses!.some(e => e.sourceRefId === `expense_${data.id}`)).toBe(false);
  });

  it.each([{ amount: -1 }, { amount: 'bad' }, { date: '2026-02-30' }, { description: '' }, { category: 'BAD' }, { plotId: 'missing' }, { cropCycleId: 'missing' }])('rejects invalid expense %j', async patch => {
    const before = structuredClone(getDatabase());
    expect((await requestApi('/api/expenses', 'POST', { category: 'GENERAL', amount: 20, date: '2026-11-01', description: 'Supplies', ...patch })).status).toBe(400);
    expect(getDatabase()).toEqual(before);
  });

  it.each(['PUT', 'DELETE'])('handles missing ID and missing expense for %s', async method => {
    expect((await requestApi('/api/expenses', method, method === 'PUT' ? {} : undefined)).status).toBe(400);
    expect((await requestApi(`/api/expenses${method === 'DELETE' ? '?id=missing' : ''}`, method, method === 'PUT' ? { id: 'missing' } : undefined)).status).toBe(404);
  });

  it.each(['POST', 'PUT', 'DELETE'])('rolls back linked expense and petty cash when %s persistence fails', async method => {
    const { date, cycle } = seedRecords();
    const entry = expenses.addExpense({ category: 'PETTY_CASH', amount: 20, date, description: 'Supplies', cropCycleId: cycle.id });
    const before = structuredClone(getDatabase());
    vi.mocked(saveDatabase).mockImplementationOnce(() => { throw new Error('disk full'); });
    const response = await requestApi(`/api/expenses${method === 'DELETE' ? `?id=${entry.id}` : ''}`, method, method === 'POST' ? { category: 'PETTY_CASH', amount: 30, date, description: 'More supplies', cropCycleId: cycle.id } : method === 'PUT' ? { id: entry.id, amount: 50 } : undefined);
    expect(response.status).toBe(method === 'DELETE' ? 500 : 400); expect(getDatabase()).toEqual(before);
  });

  it('returns a structured failure when reading expenses fails', async () => {
    vi.spyOn(expenses, 'getExpenses').mockImplementationOnce(() => { throw new Error('read failure'); });
    const response = await requestApi('/api/expenses'); expect(response.status).toBe(500); expect(await response.json()).toMatchObject({ success: false, error: 'read failure' });
  });
});
