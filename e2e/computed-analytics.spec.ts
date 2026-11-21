import { expect,test } from './fixtures';
import { authenticate } from './auth';
test('Known transaction costs and revenue reconcile in dashboard analytics', async ({ page, context }) => {
  await authenticate(context);
  const request = context.request;
  await request.post('/api/settings/reset');
  await request.post('/api/plots', { data: { name: 'Analytics Test Plot', areaAcres: 5 } });
  await request.post('/api/fertilizer-logs', { data: { transactionType: 'CONSUMPTION', fertilizerName: 'Target Fertilizer', quantityKg: 50, cost: 5000, date: '2026-11-15', loggedBy: 'Test' } });
  await request.post('/api/sales-logs', { data: { quantityKg: 500, value: 25000, buyerName: 'Test Purchaser', date: '2026-11-15', loggedBy: 'Test' } });
  const analytics = await (await request.get('/api/analytics')).json();
  expect(analytics.kpis).toMatchObject({ totalRevenue: 25000, totalExpenses: 5000, netProfit: 20000 });
  await page.goto('/');
  await expect(page.locator('main h1')).toContainText('Executive Dashboard');
  await expect(page.locator('body')).toContainText('20,000');
});
