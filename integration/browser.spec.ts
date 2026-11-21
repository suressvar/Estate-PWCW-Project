import { testBaseURL } from './helpers';
import { resetTestData, browserSignIn, testCredentials } from "./helpers";
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ playwright }) => { const setup = await playwright.request.newContext({ baseURL: testBaseURL }); try { await resetTestData(setup); } finally { await setup.dispose(); } });

test.describe('current-interface browser checks', () => {
  test('B01 rejects incorrect login credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-username').fill('Admin'); await page.locator('#login-password').fill('wrong-password');
    await page.locator('#login-submit-btn').click();
    await expect(page.getByText('Invalid username or password.')).toBeVisible(); await expect(page).toHaveURL(/\/login$/);
  });
  test('B02 requires both login fields', async ({ page }) => {
    await page.goto('/login'); await page.locator('#login-submit-btn').click();
    await expect(page.getByText('Please enter both username and password.')).toBeVisible();
  });
  test('B03 accepts configured login and loads dashboard', async ({ page }) => {
    await page.goto('/login'); await page.locator('#login-username').fill('Admin'); await page.locator('#login-password').fill(testCredentials.password);
    await page.locator('#login-submit-btn').click(); await expect(page).toHaveURL(`${testBaseURL}/`);
    await expect(page.locator('main h1')).toContainText('Executive Dashboard');
  });
  test('B04 persisted plot is visible after a full page reload', async ({ page, context, request }) => {
    await browserSignIn(context);
    await resetTestData(request);
    expect((await request.post('/api/plots', { data: { name: 'Browser Integration Plot', areaAcres: 5, status: 'ACTIVE' } })).status()).toBe(201);
    await page.goto('/plots'); await expect(page.getByText('Browser Integration Plot', { exact: true })).toBeVisible();
    await page.reload(); await expect(page.getByText('Browser Integration Plot', { exact: true })).toBeVisible();
  });
  test('B05 employee record is available to the attendance page', async ({ page, context, request }) => {
    await browserSignIn(context);
    await resetTestData(request);
    expect((await request.post('/api/employees', { data: { name: 'Browser Integration Worker', status: 'ACTIVE', wageType: 'DAILY', wageRate: 800 } })).status()).toBe(201);
    await page.goto('/workers');
    await expect(page.locator('main h1')).toContainText('Daily Attendance & Tracking');
    await expect(page.getByText('Browser Integration Worker', { exact: true }).first()).toBeVisible();
  });
});

for (const route of ['/plots', '/crops', '/employees', '/workers', '/daily-log', '/crop-cycles', '/godown', '/machines', '/expenses', '/sales-register', '/purchases', '/items', '/reports/consolidated', '/reports/pnl', '/settings']) {
  test(`browser route ${route} renders without an uncaught page error`, async ({ page, context }) => {
    await browserSignIn(context);
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200); await expect(page.locator('main h1')).toBeVisible();
    expect(errors).toEqual([]);
  });
}
