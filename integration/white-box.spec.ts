import { test, expect, type APIRequestContext } from '@playwright/test';
import { resetTestData } from './helpers';
const date = '2026-11-16';
test.beforeEach(async ({ request }) => { await resetTestData(request); });
async function employee(request: APIRequestContext, hourly = false) {
  const response = await request.post('/api/employees', { data: { name: 'White-box HTTP worker', wageType: hourly ? 'HOURLY' : 'DAILY', wageRate: hourly ? 100 : 600, status: 'ACTIVE' } });
  expect(response.status()).toBe(201); return response.json();
}
test('WBHTTP01 hourly wages agree across attendance, worker register and salary', async ({ request }) => {
  const person = await employee(request, true);
  expect((await request.post('/api/attendance/mark', { data: { employeeId: person.id, attendanceDate: date, status: 'PRESENT' } })).status()).toBe(200);
  const register = await (await request.get(`/api/workers/wages?workerId=${person.id}`)).json();
  expect(register.entries[0].computedAmount).toBe(800);
  const wages = await (await request.post('/api/salary/calculate', { data: { year: 2026, month: 11, workingDays: 26 } })).json();
  expect(wages[0].grossSalary).toBe(800);
});
test('WBHTTP02 a paid attendance correction is rejected without changing earnings', async ({ request }) => {
  const person = await employee(request);
  await request.post('/api/workers/attendance', { data: { workerId: person.id, date, status: 'PRESENT' } });
  const before = await (await request.get(`/api/workers/wages?workerId=${person.id}`)).json();
  expect((await request.post('/api/workers/wages', { data: { wageId: before.entries[0].id, paidAmount: 400 } })).status()).toBe(200);
  expect((await request.post('/api/attendance/mark', { data: { employeeId: person.id, attendanceDate: date, status: 'ABSENT' } })).status()).toBe(400);
  expect((await (await request.get(`/api/workers/wages?workerId=${person.id}`)).json()).entries[0]).toMatchObject({ computedAmount: 600, paidAmount: 400 });
});
test('WBHTTP03 fractional stock issues really reduce available stock', async ({ request }) => {
  const stock = await (await request.post('/api/godown/items', { data: { name: 'Urea', quantity: 1, ratePerUnit: 1000, unit: 'kg' } })).json();
  const response = await request.post('/api/godown/issue', { data: { godownItemId: stock.id, destinationMenu: 'Fertilizer', quantity: 0.001, date } });
  expect(response.status()).toBe(200); expect((await response.json()).updatedItem.availableQuantity).toBe(0.999);
});
test('WBHTTP04 leave approval and rejection restore prior attendance', async ({ request }) => {
  const person = await employee(request);
  await request.post('/api/attendance/mark', { data: { employeeId: person.id, attendanceDate: date, status: 'PRESENT' } });
  const leave = await (await request.post('/api/leaves', { data: { employeeId: person.id, fromDate: date, toDate: date, leaveType: 'CASUAL', status: 'PENDING' } })).json();
  expect((await request.put(`/api/leaves/${leave.id}`, { data: { status: 'APPROVED' } })).status()).toBe(200);
  expect((await request.put(`/api/leaves/${leave.id}`, { data: { status: 'REJECTED' } })).status()).toBe(200);
  expect((await (await request.get(`/api/workers/wages?workerId=${person.id}`)).json()).entries[0].computedAmount).toBe(600);
});
test('WBHTTP05 invalid multi-section dispatch leaves no partial logs', async ({ request }) => {
  const plot = await (await request.post('/api/plots', { data: { name: 'Atomic plot', areaAcres: 2 } })).json();
  const response = await request.post('/api/daily-log/master-sheet', { data: { date, plotId: plot.id, labor: { menCount: 1 }, purchase: { cost: -1 } } });
  expect(response.status()).toBe(400);
  expect(await (await request.get('/api/labor-logs')).json()).toEqual([]);
  expect(await (await request.get('/api/daily-log?skipAuto=true')).json()).toEqual([]);
});
test('WBHTTP06 internal stock transfers do not invent supplier purchases', async ({ request }) => {
  const stock = await (await request.post('/api/godown/items', { data: { name: 'Copper pipe', quantity: 2, ratePerUnit: 10 } })).json();
  expect((await request.post('/api/godown/issue', { data: { godownItemId: stock.id, destinationMenu: 'General Purchases / Plot Ops', quantity: 1, date } })).status()).toBe(200);
  expect(await (await request.get('/api/purchase-vouchers')).json()).toEqual([]);
});
