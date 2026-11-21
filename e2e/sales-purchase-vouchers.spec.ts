import { expect,test } from './fixtures';
import { authenticate } from './auth';
test.beforeEach(async ({ context }) => { await authenticate(context); });
test('Current sales and purchases navigation is available', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('aside').getByRole('button', { name: 'Sales Module' })).toBeVisible();
  await expect(page.locator('aside').getByRole('button', { name: 'Vouchers', exact: true })).toBeVisible();
  for (const route of ['/sales', '/purchases']) { await page.goto(route); await expect(page.locator('main').getByRole('heading').first()).toBeVisible(); }
});
test('Record an itemized sale in the current form and verify invoice and register', async ({ page }) => {
  await page.goto('/sales');
  const buyer = `Voucher buyer ${Date.now()}`;
  await page.getByLabel('Buyer name', { exact: true }).fill(buyer);
  await page.getByLabel('Sale item', { exact: true }).first().fill('Tomato');
  await page.getByLabel('Sale quantity', { exact: true }).first().fill('800');
  await page.getByLabel('Sale unit price', { exact: true }).first().fill('45');
  await page.getByRole('button', { name: 'Record Sales Transaction', exact: true }).click();
  await expect(page).toHaveURL(/sales-invoice\//);
  await expect(page.locator('body')).toContainText(buyer);
  await expect(page.locator('body')).toContainText(/₹36,?000\.00/);
  await page.goto('/sales-register');
  await expect(page.locator('body')).toContainText(buyer);
});
test('Printable sales voucher contains official totals and buyer details', async ({ page, context }) => {
  await context.request.post('/api/sales/other', { data: { buyerName: 'Printable Buyer', items: [{ itemName: 'Coconut', quantity: 10, pricePerUnit: 30 }] } });
  await page.goto('/sales-register');
  await page.getByPlaceholder(/Search.*buyer.*item.*invoice/i).fill('Printable Buyer');
  await page.getByRole('button', { name: 'Voucher', exact: true }).click();
  const voucher = page.locator('#voucher-printable-area');
  await expect(voucher).toBeVisible();
  await expect(voucher).toContainText('OFFICIAL SALES VOUCHER');
  await expect(voucher).toContainText('Printable Buyer');
  await expect(voucher).toContainText('Amount');
});
test('Current purchase form saves a voucher and inward stock', async ({ page, context }) => {
  await page.goto('/purchases');
  await page.getByRole('button', { name: 'New Voucher', exact: true }).first().click();
  const vendor = `Greenfield Spares ${Date.now()}`;
  await page.getByLabel('Supplier name', { exact: true }).fill(vendor);
  await page.getByLabel('Purchase item', { exact: true }).first().fill('High Pressure Valve');
  await page.getByLabel('Purchase quantity', { exact: true }).first().fill('2');
  await page.getByLabel('Purchase unit price', { exact: true }).first().fill('100');
  await page.getByRole('button', { name: 'Save Voucher', exact: true }).click();
  await expect(page.locator('body')).toContainText(vendor);
  const stock = await (await context.request.get('/api/godown/items')).json();
  expect(stock.items.some((item: { name: string; availableQuantity: number }) => item.name === 'High Pressure Valve' && item.availableQuantity === 2)).toBe(true);
});
