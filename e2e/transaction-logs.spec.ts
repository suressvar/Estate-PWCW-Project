import { expect,test } from '@playwright/test';
import { authenticate } from './auth';
test.beforeEach(async ({ context }) => {
  await authenticate(context);
  const plots = await (await context.request.get('/api/plots')).json();
  if (plots.length === 0) await context.request.post('/api/plots', { data: { name: 'Logging Test Plot', areaAcres: 5 } });
});
for (const sample of [
  { route: '/fertilizer', name: 'Test Urea', category: 'Fertilizer & Nutrition', select: 'Fertilizer stock item', quantity: 'Fertilizer quantity', amount: '50' },
  { route: '/diesel', name: 'Test Diesel', category: 'Diesel & Fuel', select: 'Diesel stock item', quantity: 'Diesel quantity', amount: '15' },
]) {
  test(`Stock consumption form at ${sample.route} records an issue and reconciles balance`, async ({ page, context }) => {
    const item = await (await context.request.post('/api/godown/items', { data: { name: sample.name, category: sample.category, quantity: 100, ratePerUnit: 20 } })).json();
    await page.goto(sample.route);
    await page.getByLabel(sample.select, { exact: true }).selectOption(item.id);
    await page.getByLabel(sample.quantity, { exact: true }).fill(sample.amount);
    const saved = page.waitForResponse(response => response.url().endsWith('/api/godown/issue') && response.request().method() === 'POST');
    await page.locator('form').first().locator('button[type="submit"]').click();
    expect((await saved).status()).toBe(200);
    const stock = await (await context.request.get('/api/godown/items')).json();
    expect(stock.items.find((row: { id: string }) => row.id === item.id).availableQuantity).toBe(100 - Number(sample.amount));
    const table = page.locator('table').first();
    if (sample.route === '/diesel') {
      await expect(table).toContainText('15 L');
      await expect(table).toContainText('₹300.00');
    } else await expect(table).toContainText(sample.name);
  });
}
test('Machinery form calculates runtime and records the operation', async ({ page, context }) => {
  await page.goto('/machinery');
  await page.getByLabel('Start time', { exact: true }).fill('08:00');
  await page.getByLabel('End time', { exact: true }).fill('12:00');
  const saved = page.waitForResponse(response => response.url().endsWith('/api/machinery-logs') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Record Machine Operation', exact: true }).click();
  expect((await saved).status()).toBe(201);
  const logs = await (await context.request.get('/api/machinery-logs')).json();
  expect(logs[0].runningHours).toBe(4);
  await expect(page.locator('table').first()).toContainText(logs[0].machineName);
});
test('Master daily sheet labor dispatch persists the computed labor cost', async ({ page, context }) => {
  const plots = await (await context.request.get('/api/plots')).json();
  const result = await context.request.post('/api/daily-log/master-sheet', { data: { plotId: plots[0].id, date: '2026-11-15', labor: { menCount: 5, womenCount: 5, menWageRate: 600, womenWageRate: 400, workingHours: 8 } } });
  expect(result.status()).toBe(201);
  expect((await result.json()).dispatched.labor.totalCost).toBe(5000);
  await page.goto('/daily-log'); await expect(page.locator('main h1')).toContainText('Daily Work Tracking');
});
test('Production API persists quantities without a retired production page', async ({ context }) => {
  const result = await context.request.post('/api/production-logs', { data: { quantityKg: 850, date: '2026-11-15', loggedBy: 'Test' } });
  expect(result.status()).toBe(201);
  const logs = await (await context.request.get('/api/production-logs')).json();
  expect(logs[0].quantityKg).toBe(850);
});
test('Sales API creates an invoice visible in the current sales register', async ({ page, context }) => {
  const result = await context.request.post('/api/sales/other', { data: { buyerName: 'Global Agritech Test', items: [{ itemName: 'Tomato', quantity: 750, pricePerUnit: 45 }] } });
  expect(result.status()).toBe(201);
  expect((await result.json()).items[0].totalAmount).toBe(33750);
  await page.goto('/sales-register'); await expect(page.locator('body')).toContainText('Global Agritech Test');
});
