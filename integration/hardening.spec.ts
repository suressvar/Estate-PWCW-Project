import { test, expect } from '@playwright/test';
import { resetTestData, browserSignIn } from './helpers';
test.beforeEach(async ({ request }) => { await resetTestData(request); });
test('H07 security headers and streamed request limits apply to the production server', async ({ request }) => {
  const response = await request.get('/api/analytics');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['x-frame-options']).toBe('DENY');
  expect((await request.post('/api/plots', { data: { name: 'x'.repeat(1024 * 1024 + 1), areaAcres: 5 } })).status()).toBe(413);
  expect(await (await request.get('/api/plots')).json()).toEqual([]);
});
test('H01 parallel employee creation preserves every distinct ID and record', async ({ request }) => {
  const responses = await Promise.all(Array.from({ length: 30 }, (_, index) => request.post('/api/employees', { data: { name: `Rapid ${index}`, wageRate: 0, wageType: 'DAILY', status: 'ACTIVE' } })));
  const rows = [];
  for (const response of responses) { expect(response.status()).toBe(201); rows.push(await response.json()); }
  expect(new Set(rows.map(row => row.id)).size).toBe(30);
  expect(await (await request.get('/api/employees')).json()).toHaveLength(30);
  const workers = await (await request.get('/api/workers')).json();
  expect(workers.every((row: { dailyWageRate: number }) => row.dailyWageRate === 0)).toBe(true);
});
test('H02 paid salary history survives employee and worker deletion attempts', async ({ request }) => {
  const employee = await (await request.post('/api/employees', { data: { name: 'Paid history', wageRate: 600, wageType: 'DAILY', status: 'ACTIVE' } })).json();
  await request.post('/api/attendance/mark', { data: { employeeId: employee.id, attendanceDate: '2026-11-16', status: 'PRESENT' } });
  const wages = await (await request.post('/api/salary/calculate', { data: { year: 2026, month: 11, workingDays: 26 } })).json();
  expect((await request.post(`/api/salary/pay/${wages[0].id}`, { data: { paymentDate: '2026-11-16', paymentMode: 'Cash' } })).status()).toBe(200);
  expect((await request.delete(`/api/employees/${employee.id}`)).status()).toBe(400);
  expect((await request.delete(`/api/workers/${employee.id}`)).status()).toBe(409);
  expect((await request.get(`/api/employees/${employee.id}`)).status()).toBe(200);
  expect((await (await request.get('/api/wages?year=2026&month=11')).json())[0]).toMatchObject({ status: 'PAID', netSalary: 600 });
});
test('H03 purchase totals are derived from lines and bulk stock deletion preserves history', async ({ request }) => {
  const response = await request.post('/api/purchase-vouchers', { data: { vendorName: 'Actual supplier', cost: 1, subtotal: 1, taxPercent: 10, taxAmount: 999, items: [{ id: 'line', description: 'Copper pipe', quantity: 2, unit: 'units', rate: 10, amount: 1 }] } });
  expect(response.status()).toBe(201);
  const voucher = await response.json(); expect(voucher).toMatchObject({ cost: 22, subtotal: 20, taxAmount: 2 });
  expect((await request.delete('/api/godown/items')).status()).toBe(409);
  const vouchers = await (await request.get('/api/purchase-vouchers')).json();
  expect(vouchers.some((row: { id: string }) => row.id === voucher.id)).toBe(true);
  const stock = await (await request.get('/api/godown/items')).json();
  expect(stock.items).toHaveLength(1);
});
test('H04 missing employee and crop cycle pages show a useful response without crashing', async ({ page, context }) => {
  await browserSignIn(context); const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/employees/nonexistent'); await expect(page.locator('main').getByRole('alert')).toContainText('Employee not found');
  await page.goto('/crop-cycles/nonexistent'); await expect(page.locator('main').getByRole('alert')).toContainText('Crop cycle not found');
  expect(errors).toEqual([]);
});
test('H05 a phone-sized screen can open navigation and reach the plot register', async ({ page, context }) => {
  await browserSignIn(context); await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('button', { name: 'Open Navigation Menu' }).click();
  await page.locator('aside').getByRole('button', { name: 'Plots & Crops' }).click();
  await page.getByRole('link', { name: 'Plots Master' }).click();
  await expect(page.locator('main h1')).toContainText('Plot Master Data Management');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('H06 parallel authenticated reads remain correct under a bounded load', async ({ request }) => {
  const started = Date.now();
  const responses = await Promise.all(Array.from({ length: 100 }, () => request.get('/api/analytics')));
  for (const response of responses) { expect(response.status()).toBe(200); expect((await response.json()).kpis).toBeDefined(); }
  expect(Date.now() - started).toBeLessThan(15000);
});
