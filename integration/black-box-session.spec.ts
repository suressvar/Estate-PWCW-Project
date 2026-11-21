import { test, expect } from '@playwright/test';
import { resetTestData, browserSignIn } from './helpers';

test('BB session history is reauthenticated after logout in each browser', async ({ page, context, request }) => {
  await resetTestData(request);
  await browserSignIn(context);
  await page.goto('/plots');
  await page.goto('/employees');
  await page.getByRole('button', { name: /^Logout(?:\s|$)/ }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.request.get('/api/employees')).status()).toBe(401);
});
