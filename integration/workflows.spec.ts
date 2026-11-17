import { resetTestData } from "./helpers";
import { test, expect, type APIRequestContext } from '@playwright/test';

const date = '2026-11-15';
test.beforeEach(async ({ request }) => {
  await resetTestData(request);
});
async function create(request: APIRequestContext, url: string, data: unknown) {
  const response = await request.post(url, { data });
  expect(response.status(), `${url}: ${await response.text()}`).toBe(201);
  return response.json();
}
async function cycleFixture(request: APIRequestContext) {
  const plot = await create(request, '/api/plots', { name: 'Integration North', areaAcres: 5, status: 'ACTIVE' });
  const cycle = await create(request, '/api/crop-cycles', { plotId: plot.id, cropName: 'Tomato', sowingDate: date, expectedHarvestDate: '2027-02-01' });
  return { plot, cycle };
}
test.describe('real HTTP integration workflows', () => {
  test('I01 crop expense and income persist across routes and roll into plot finances', async ({ request }) => {
    const { plot, cycle } = await cycleFixture(request);
    await create(request, `/api/crop-cycles/${cycle.id}/expenses`, { category: 'LABOR', amount: 100, date, description: 'Labor' });
    await create(request, `/api/crop-cycles/${cycle.id}/incomes`, { source: 'MARKET_SALE', quantitySold: 10, ratePerUnit: 30, unit: 'kg', date });
    const details = await (await request.get(`/api/crop-cycles/${cycle.id}`)).json();
    expect(details.financials).toMatchObject({ totalExpenses: 100, totalIncome: 300, netProfitLoss: 200 });
    const rollup = await (await request.get(`/api/plots/${plot.id}/financial-rollup`)).json();
    expect(rollup).toMatchObject({ lifetimeExpenses: 100, lifetimeIncome: 300, lifetimeProfitLoss: 200 });
    expect(details.expenses).toHaveLength(1); expect(details.incomes).toHaveLength(1);
  });
  test('I02 employee attendance calculates wages and synchronizes one crop expense through payment', async ({ request }) => {
    const { cycle } = await cycleFixture(request);
    const employee = await create(request, '/api/employees', { name: 'Integration Worker', wageType: 'DAILY', wageRate: 800, status: 'ACTIVE' });
    const attendance = await request.post('/api/workers/attendance', { data: { workerId: employee.id, date, status: 'PRESENT', cropCycleId: cycle.id } });
    expect(attendance.status()).toBe(200);
    const { wage } = await attendance.json(); expect(wage.computedAmount).toBe(800);
    const pay = await request.post('/api/workers/wages', { data: { wageId: wage.id, paidAmount: 400, paidDate: date } });
    expect(pay.status()).toBe(200); expect((await pay.json()).paidStatus).toBe('PARTIAL');
    await request.post('/api/workers/attendance', { data: { workerId: employee.id, date, status: 'HALF_DAY', cropCycleId: cycle.id } });
    const register = await (await request.get(`/api/workers/wages?workerId=${employee.id}`)).json();
    expect(register).toMatchObject({ totalComputed: 400, totalPaid: 400, totalBalance: 0 });
    expect(register.entries).toHaveLength(1);
    const crop = await (await request.get(`/api/crop-cycles/${cycle.id}`)).json();
    expect(crop.expenses).toHaveLength(1); expect(crop.financials.totalExpenses).toBe(400);
  });
  test('I03 voucher inward, godown dispatch and fertilizer consumption reconcile', async ({ request }) => {
    const voucher = await create(request, '/api/vouchers/feed', { feedName: 'Urea', quantity: 10, cost: 200, unit: 'kg', purchaseDate: date });
    const stock = await (await request.get('/api/godown/items')).json();
    const item = stock.items.find((record: { sourceVoucherId: string }) => record.sourceVoucherId === voucher.id);
    expect(item.availableQuantity).toBe(10);
    const issue = await request.post('/api/godown/issue', { data: { godownItemId: item.id, destinationMenu: 'Fertilizer', quantity: 3, date } });
    expect(issue.status()).toBe(200);
    const updated = await (await request.get('/api/godown/items')).json();
    expect(updated.items[0]).toMatchObject({ availableQuantity: 7, totalValue: 140 });
    const logs = await (await request.get('/api/fertilizer-logs')).json();
    expect(logs[0]).toMatchObject({ quantityKg: 3, cost: 60, transactionType: 'CONSUMPTION' });
  });
  test('I04 petty-cash balances recalculate after backdated top-ups and expense deletion', async ({ request }) => {
    await create(request, '/api/expenses/petty-cash', { amount: 1000, date });
    const result = await create(request, '/api/expenses', { category: 'PETTY_CASH', amount: 100, date: '2026-11-16', description: 'Tea' });
    await create(request, '/api/expenses/petty-cash', { amount: 200, date: '2026-11-14' });
    let status = await (await request.get('/api/expenses/petty-cash?statusOnly=true')).json();
    expect(status.data).toMatchObject({ currentBalance: 1100, totalInflow: 1200, totalOutflow: 100 });
    expect((await request.delete(`/api/expenses?id=${result.data.id}`)).status()).toBe(200);
    status = await (await request.get('/api/expenses/petty-cash?statusOnly=true')).json();
    expect(status.data.currentBalance).toBe(1200);
  });
  test('I05 invoice totals agree with sales analytics after edits', async ({ request }) => {
    const invoice = await create(request, '/api/sales/crop', { dateOfSale: date, buyerName: 'Test Buyer', items: [{ itemName: 'Tomato', quantity: 2, pricePerUnit: 30 }, { itemName: 'Coconut', quantity: 3, pricePerUnit: 10 }] });
    const analytics = await (await request.get('/api/sales-analytics')).json();
    expect(analytics.kpis).toMatchObject({ totalRevenue: 90, totalInvoices: 1 });
    const detail = await (await request.get(`/api/sales-invoice/${invoice.invoiceGroupId}`)).json();
    expect(detail.totalAmount).toBe(90);
    expect((await request.put(`/api/sales/crop/${invoice.items[0].id}`, { data: { quantity: 4 } })).status()).toBe(200);
    const revised = await (await request.get(`/api/sales-invoice/${invoice.invoiceGroupId}`)).json();
    expect(revised.totalAmount).toBe(150);
    expect((await (await request.get('/api/sales-analytics')).json()).kpis.totalRevenue).toBe(150);
  });
  test('I06 catalog code uniqueness survives separate HTTP requests', async ({ request }) => {
    await create(request, '/api/operation-items', { name: 'Urea', itemCode: 'FERT-001', category: 'Fertilizer & Nutrition' });
    const duplicate = await request.post('/api/operation-items', { data: { name: 'Duplicate', itemCode: ' fert-001 ', category: 'Fertilizer & Nutrition' } });
    expect(duplicate.status()).toBe(400);
    const list = await (await request.get('/api/operation-items')).json();
    expect(list.items).toHaveLength(1); expect(list.stats.totalItems).toBe(1);
  });
  test('I07 rejected over-issue leaves stock and movements unchanged', async ({ request }) => {
    const item = await create(request, '/api/godown/items', { name: 'Urea', quantity: 10, ratePerUnit: 20 });
    const before = await (await request.get('/api/godown/movements')).json();
    expect((await request.post('/api/godown/issue', { data: { godownItemId: item.id, destinationMenu: 'Fertilizer', quantity: 11, date } })).status()).toBe(400);
    const after = await (await request.get('/api/godown/items')).json();
    expect(after.items[0].availableQuantity).toBe(10);
    expect(await (await request.get('/api/godown/movements')).json()).toEqual(before);
  });
  test('I08 linked general expense is counted once across report modules', async ({ request }) => {
    const { cycle } = await cycleFixture(request);
    await create(request, '/api/expenses', { category: 'GENERAL', amount: 100, date, description: 'Tools', cropCycleId: cycle.id });
    const crop = await (await request.get(`/api/crop-cycles/${cycle.id}`)).json();
    expect(crop.financials.totalExpenses).toBe(100);
    const consolidated = await (await request.get('/api/reports/consolidated')).json();
    expect(consolidated.data.kpis.totalExpenses).toBe(100);
  });
  test('I09 new worker remains visible after re-fetching its register', async ({ request }) => {
    const worker = await create(request, '/api/workers', { name: 'Direct Worker', dailyWageRate: 800 });
    const list = await (await request.get('/api/workers')).json();
    expect(list.map((row: { id: string }) => row.id)).toContain(worker.id);
  });
  test('I10 purchase correction updates the stock module', async ({ request }) => {
    const voucher = await create(request, '/api/vouchers/feed', { feedName: 'Feed', quantity: 10, cost: 100, purchaseDate: date });
    expect((await request.put(`/api/vouchers/feed/${voucher.id}`, { data: { quantity: 20, cost: 200 } })).status()).toBe(200);
    const stock = await (await request.get('/api/godown/items')).json();
    expect(stock.items[0].availableQuantity).toBe(20);
  });
  test('I11 concurrent expense submissions retain every transaction', async ({ request }) => {
    const responses = await Promise.all(Array.from({ length: 20 }, (_, index) => request.post('/api/expenses', {
      data: { category: 'GENERAL', amount: 10, date, description: `Concurrent entry ${index}` },
    })));
    expect(responses.every(response => response.status() === 201)).toBe(true);
    const listing = await (await request.get('/api/expenses')).json();
    expect(listing.data).toHaveLength(20);
    expect(new Set(listing.data.map((record: { id: string }) => record.id)).size).toBe(20);
    const summary = await (await request.get('/api/expenses?summary=true')).json();
    expect(summary.data.totalExpenses).toBe(200);
  });
  test('I12 main purchase deletion reverses unused inward stock', async ({ request }) => {
    const purchase = await create(request, '/api/purchase-vouchers', { vendorName: 'Reversal Supplier', date, cost: 200, items: [{ description: 'Urea', quantity: 2, rate: 100, amount: 200, unit: 'kg' }] });
    expect((await request.delete(`/api/purchase-vouchers?id=${purchase.id}`)).status()).toBe(200);
    const stock = await (await request.get('/api/godown/items')).json();
    expect(stock.items.filter((item: { sourceVoucherId?: string }) => item.sourceVoucherId === purchase.id)).toEqual([]);
  });
  test('I13 purchase deletion preserves issued stock and the original voucher', async ({ request }) => {
    const purchase = await create(request, '/api/purchase-vouchers', { vendorName: 'Issued Supplier', date, cost: 200, items: [{ description: 'Urea', quantity: 2, rate: 100, amount: 200, unit: 'kg' }] });
    const stock = await (await request.get('/api/godown/items')).json();
    const item = stock.items.find((row: { sourceVoucherId?: string }) => row.sourceVoucherId === purchase.id);
    expect((await request.post('/api/godown/issue', { data: { godownItemId: item.id, destinationMenu: 'Fertilizer', quantity: 1, date } })).status()).toBe(200);
    expect((await request.delete(`/api/purchase-vouchers?id=${purchase.id}`)).status()).toBe(400);
    const purchases = await (await request.get('/api/purchase-vouchers')).json();
    expect(purchases.some((row: { id: string }) => row.id === purchase.id)).toBe(true);
    const remaining = await (await request.get('/api/godown/items')).json();
    expect(remaining.items.find((row: { id: string }) => row.id === item.id).availableQuantity).toBe(1);
  });
  test('I14 invalid purchase line cannot partially save a voucher or stock', async ({ request }) => {
    const response = await request.post('/api/purchase-vouchers', { data: { vendorName: 'Invalid Supplier', date, cost: 100, items: [{ description: 'Valid', quantity: 1, rate: 100 }, { description: 'Invalid', quantity: -1, rate: 20 }] } });
    expect(response.status()).toBe(400);
    expect(await (await request.get('/api/purchase-vouchers')).json()).toEqual([]);
    expect((await (await request.get('/api/godown/items')).json()).items).toEqual([]);
  });
});
