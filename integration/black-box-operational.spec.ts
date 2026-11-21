import { test, expect } from '@playwright/test';
import { resetTestData, browserSignIn } from './helpers';
test.beforeEach(async ({ request }) => { await resetTestData(request); });

const samples = [
  { url: '/api/diesel-logs', data: { transactionType: 'CONSUMPTION', quantityLiters: 1, cost: 10 }, field: 'quantityLiters' },
  { url: '/api/fertilizer-logs', data: { transactionType: 'CONSUMPTION', fertilizerName: 'Urea', quantityKg: 1, cost: 10 }, field: 'quantityKg' },
  { url: '/api/machinery-logs', data: { machineName: 'Tractor', startTime: '08:00', endTime: '09:00', runningHours: 1, dieselConsumedLiters: 4 }, field: 'runningHours' },
  { url: '/api/production-logs', data: { quantityKg: 1 }, field: 'quantityKg' },
];
for (const sample of samples) for (const invalid of ['negative', 'nonnumeric', 'overflow', 'date']) {
  test(`BB operational boundary ${sample.url}: ${invalid} cannot corrupt the register`, async ({ request }) => {
    const data: Record<string, unknown> = { ...sample.data, date: invalid === 'date' ? '2026-02-30' : '2026-11-21', loggedBy: 'Boundary check' };
    if (invalid !== 'date') data[sample.field] = invalid === 'negative' ? -1 : invalid === 'overflow' ? '1e999' : 'invalid';
    const response = await request.post(sample.url, { data });
    expect([400, 422], `Received ${response.status()}: ${await response.text()}`).toContain(response.status());
    expect(await (await request.get(sample.url)).json()).toEqual([]);
  });
}

test('BB fuel dispatch retains the selected plot, equipment, quantity and operator', async ({ request }) => {
  const item = await (await request.post('/api/godown/items', { data: { name: 'Fuel fixture', category: 'Diesel & Fuel', quantity: 2, ratePerUnit: 20 } })).json();
  const response = await request.post('/api/godown/issue', { data: { godownItemId: item.id, destinationMenu: 'Diesel', quantity: 1, date: '2026-11-21', plotName: 'North field', cropActivityName: 'Tractor', issuedTo: 'Operator A' } });
  expect(response.status()).toBe(200);
  const logs = await (await request.get('/api/diesel-logs')).json();
  expect(logs[0]).toMatchObject({ quantityLiters: 1, cost: 20, plotName: 'North field', machineName: 'Tractor', loggedBy: 'Operator A' });
});

test('BB fractional diesel issue is available through the public form', async ({ request, page, context }) => {
  await request.post('/api/plots', { data: { name: 'Fractional fuel plot', areaAcres: 1 } });
  const item = await (await request.post('/api/godown/items', { data: { name: 'Fractional fuel', category: 'Diesel & Fuel', quantity: 1, ratePerUnit: 20 } })).json();
  await browserSignIn(context);
  await page.goto('/diesel');
  await page.getByLabel('Diesel stock item', { exact: true }).selectOption(item.id);
  await page.getByLabel('Diesel quantity', { exact: true }).fill('0.001');
  const saved = page.waitForResponse(response => response.url().endsWith('/api/godown/issue') && response.request().method() === 'POST');
  await page.locator('form').first().locator('button[type="submit"]').click();
  expect((await saved).status()).toBe(200);
  await expect(page.locator('table').first()).toContainText('0.001 L');
  const stock = await (await request.get('/api/godown/items')).json();
  expect(stock.items.find((row: { id: string }) => row.id === item.id).availableQuantity).toBe(0.999);
});
