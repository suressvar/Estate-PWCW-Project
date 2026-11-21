import { test, expect } from '@playwright/test';
import { resetTestData, browserSignIn } from './helpers';

// Exercise only the application's public HTTP and browser boundaries.
test.beforeEach(async ({ request }) => { await resetTestData(request); });

const writeEndpoints = [
  '/api/plots', '/api/crops', '/api/employees', '/api/workers', '/api/expenses',
  '/api/machines', '/api/operation-items', '/api/godown/items', '/api/ledger-groups',
  '/api/expense-ledgers', '/api/employee-roles', '/api/expense-units', '/api/leaves',
  '/api/daily-log/master-sheet', '/api/purchase-vouchers', '/api/sales/crop',
];
for (const url of writeEndpoints) {
  for (const [label, body] of [['null', 'null'], ['array', '[]'], ['boolean', 'true'], ['string', '"invalid"'], ['malformed', '{']] as const) {
    test(`BB input ${label} at ${url} returns a client error`, async ({ request }) => {
      const response = await request.post(url, { data: Buffer.from(body), headers: { 'Content-Type': 'application/json' } });
      expect([400, 422], `Unexpected response: ${response.status()} ${await response.text()}`).toContain(response.status());
      expect((await request.get('/api/plots')).status()).toBe(200);
      expect((await request.get('/api/employees')).status()).toBe(200);
    });
  }
}

for (const route of [
  '/attendance', '/attendance/summary', '/leaves', '/salary/calculate', '/employee-roles',
  '/ledger-groups', '/expense-ledgers', '/units', '/plot-crops', '/plot-operations/items',
  '/godown/issue', '/godown/movements', '/stock-valuations', '/reports', '/reports/stock-inventory',
  '/sales', '/sales-dashboard', '/sales-invoice', '/purchases/register', '/purchases/retailers',
  '/purchases/other', '/fertilizer', '/diesel', '/machinery', '/users', '/wages', '/vouchers',
]) {
  test(`BB empty register ${route} remains usable after reload`, async ({ page, context }) => {
    await browserSignIn(context);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('main')).not.toContainText('Application error');
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const url of ['/api/employees/does-not-exist', '/api/crop-cycles/does-not-exist', '/api/sales-invoice/does-not-exist']) {
  test(`BB missing resource ${url} has a useful client response`, async ({ request }) => {
    const response = await request.get(url);
    expect(response.status()).toBe(404);
  });
}

test('BB rejected plot changes preserve the saved record', async ({ request }) => {
  const created = await request.post('/api/plots', { data: { name: 'Saved plot தமிழ் 🌱', areaAcres: 2.5, status: 'ACTIVE' } });
  expect(created.status()).toBe(201);
  const original = await created.json();
  const invalid = await request.put('/api/plots', { data: { id: original.id, areaAcres: -1 } });
  expect([400, 422]).toContain(invalid.status());
  const rows = await (await request.get('/api/plots')).json();
  expect(rows.find((row: { id: string }) => row.id === original.id)).toMatchObject({ name: original.name, areaAcres: 2.5 });
});

test('BB stored markup is shown as text without executing scripts', async ({ page, context, request }) => {
  const name = '<img src=x onerror="window.__blackBoxExecuted=true">';
  expect((await request.post('/api/plots', { data: { name, areaAcres: 1, status: 'ACTIVE' } })).status()).toBe(201);
  await browserSignIn(context);
  await page.goto('/plots');
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, '__blackBoxExecuted'))).toBeUndefined();
});

test('BB failed save retains plot input and supports a successful retry', async ({ page, context, request }) => {
  await browserSignIn(context);
  await page.goto('/plots');
  await page.locator('#add-plot-btn').click();
  await page.locator('#plot-name-input').fill('Retry orchard');
  await page.locator('#plot-area-input').fill('3.5');
  await page.route('**/api/plots', async route => {
    if (route.request().method() === 'POST') await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporarily unavailable. Retry your save.' }) });
    else await route.continue();
  });
  await page.locator('#save-plot-btn').click();
  await expect(page.getByText('Temporarily unavailable. Retry your save.')).toBeVisible();
  await expect(page.locator('#plot-name-input')).toHaveValue('Retry orchard');
  await expect(page.locator('#plot-area-input')).toHaveValue('3.5');
  expect(await (await request.get('/api/plots')).json()).toEqual([]);
  await page.unroute('**/api/plots');
  await page.locator('#save-plot-btn').click();
  await expect(page.locator('table')).toContainText('Retry orchard');
  await page.reload();
  await expect(page.locator('table')).toContainText('Retry orchard');
});

test('BB repeated save clicks create only one plot', async ({ page, context, request }) => {
  await browserSignIn(context);
  await page.goto('/plots');
  await page.locator('#add-plot-btn').click();
  await page.locator('#plot-name-input').fill('Single submission');
  await page.locator('#plot-area-input').fill('2');
  await page.route('**/api/plots', async route => {
    if (route.request().method() === 'POST') await new Promise(resolve => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.locator('#save-plot-btn').click({ clickCount: 2 });
  await expect(page.locator('table')).toContainText('Single submission');
  expect(await (await request.get('/api/plots')).json()).toHaveLength(1);
});

test('BB canceling an unsaved plot leaves the register unchanged', async ({ page, context, request }) => {
  await browserSignIn(context);
  await page.goto('/plots');
  await page.locator('#add-plot-btn').click();
  await page.locator('#plot-name-input').fill('Do not save');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#plot-name-input')).not.toBeVisible();
  expect(await (await request.get('/api/plots')).json()).toEqual([]);
});

test('BB sales CSV exports neutralize formula-like customer names', async ({ page, context, request }) => {
  const names = ['=1+1', '+1+1', '@SUM(1+1)', '-1+1'];
  for (const buyerName of names) {
    const response = await request.post('/api/sales/other', { data: { buyerName, items: [{ itemName: 'Tomato', quantity: 1, pricePerUnit: 10 }] } });
    expect(response.status()).toBe(201);
  }
  await browserSignIn(context);
  await page.goto('/sales-register');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const stream = await (await downloadPromise).createReadStream();
  expect(stream).not.toBeNull();
  let csv = '';
  for await (const chunk of stream!) csv += chunk.toString();
  for (const name of names) expect(csv, `Unsafe exported text: ${name}`).toContain(`"\t${name}"`);
});

test('BB sales download preserves commas, quotes, Unicode, hashes and zero amounts', async ({ page, context, request }) => {
  const buyerName = 'Tea, "Green" #1 தமிழ்';
  expect((await request.post('/api/sales/other', { data: { buyerName, items: [{ itemName: 'Sample', quantity: 1, pricePerUnit: 0 }] } })).status()).toBe(201);
  await browserSignIn(context);
  await page.goto('/sales-register');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click();
  const stream = await (await downloadPromise).createReadStream();
  let csv = '';
  for await (const chunk of stream!) csv += chunk.toString();
  expect(csv).toContain('"Tea, ""Green"" #1 தமிழ்"');
  expect(csv).toContain('Sample,1,kg,0,0,');
});

test('BB downloaded workforce and consolidated reports neutralize formula-like text', async ({ request }) => {
  expect((await request.post('/api/employees', { data: { name: '=1+1', status: 'ACTIVE', wageType: 'DAILY', wageRate: 600 } })).status()).toBe(201);
  expect((await request.post('/api/expenses', { data: { description: '+1+1', category: 'GENERAL', amount: 10, date: '2026-11-21' } })).status()).toBe(201);
  const workforce = await request.get('/api/workers/summary?year=2026&month=11&format=csv');
  expect(workforce.status()).toBe(200);
  expect(await workforce.text()).toContain('"\t=1+1"');
  const consolidated = await request.get('/api/reports/consolidated?format=csv');
  expect(consolidated.status()).toBe(200);
  expect(await consolidated.text()).toContain('"\t+1+1"');
});

test('BB logout and browser Back cannot reopen a protected register', async ({ page, context }) => {
  await browserSignIn(context);
  await page.goto('/plots');
  await page.goto('/employees');
  await page.getByRole('button', { name: /^Logout(?:\s|$)/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get('/api/employees')).status()).toBe(401);
});

for (const route of ['/salary/calculate', '/reports/consolidated', '/daily-log', '/sales-register', '/employees']) {
  test(`BB phone layout ${route} keeps navigation and content within the screen`, async ({ page, context }) => {
    await browserSignIn(context);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), 'The whole page should not require horizontal scrolling').toBeLessThanOrEqual(390);
    await page.getByRole('button', { name: 'Open Navigation Menu' }).click();
    await expect(page.locator('aside')).toBeVisible();
  });
}

test('BB crop save rejection retains the form for retry', async ({ page, context, request }) => {
  await browserSignIn(context);
  await page.goto('/crops');
  await page.locator('#add-crop-btn').click();
  await page.locator('#crop-name-input').fill('Tea crop retry');
  await page.route('**/api/crops', async route => {
    if (route.request().method() === 'POST') await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Crop save temporarily unavailable"}' });
    else await route.continue();
  });
  await page.locator('#save-crop-btn').click();
  await expect(page.getByRole('alert').filter({ hasText: 'Crop save temporarily unavailable' })).toBeVisible();
  await expect(page.locator('#crop-name-input')).toHaveValue('Tea crop retry');
  expect(await (await request.get('/api/crops')).json()).toEqual([]);
  await page.unroute('**/api/crops');
  await page.locator('#save-crop-btn').click();
  await expect(page.locator('table')).toContainText('Tea crop retry');
});

test('BB logout failure shows feedback and does not claim the session ended', async ({ page, context }) => {
  await browserSignIn(context);
  await page.goto('/employees');
  await page.route('**/api/auth/logout', route => route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Unavailable"}' }));
  await page.getByRole('button', { name: /^Logout(?:\s|$)/ }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Unable to sign out. Please try again.' })).toBeVisible();
  await expect(page).toHaveURL(/\/employees$/);
  expect((await context.request.get('/api/employees')).status()).toBe(200);
  await page.unroute('**/api/auth/logout');
  await page.getByRole('button', { name: /^Logout(?:\s|$)/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get('/api/employees')).status()).toBe(401);
});

for (const route of ['/plots', '/crops']) {
  test(`BB failed register load ${route} reports the problem and supports retry`, async ({ page, context, request }) => {
    expect((await request.post(`/api${route}`, { data: { name: 'Recovered register', type: 'CROP', areaAcres: 1, status: 'ACTIVE' } })).status()).toBe(201);
    await browserSignIn(context);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(`**/api${route}`, async intercepted => {
      if (intercepted.request().method() === 'GET') await intercepted.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Temporarily unavailable"}' });
      else await intercepted.continue();
    });
    await page.goto(route);
    await expect(page.getByRole('alert').filter({ hasText: 'Unable to load' })).toBeVisible();
    expect(errors).toEqual([]);
    await page.unroute(`**/api${route}`);
    await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Unable to load' })).not.toBeVisible();
    await expect(page.locator('table')).toContainText('Recovered register');
  });
}
