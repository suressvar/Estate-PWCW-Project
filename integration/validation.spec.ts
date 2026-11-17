import { resetTestData } from "./helpers";
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ request }) => { await resetTestData(request); });

const date = '2026-11-15';
const cases: { name: string; url: string; data: unknown }[] = [
  { name: 'V01 plot requires a name', url: '/api/plots', data: { areaAcres: 5 } },
  { name: 'V02 plot rejects negative acreage', url: '/api/plots', data: { name: 'Bad', areaAcres: -5 } },
  { name: 'V03 plot rejects nonnumeric acreage', url: '/api/plots', data: { name: 'Bad', areaAcres: 'oops' } },
  { name: 'V04 plot rejects invalid status', url: '/api/plots', data: { name: 'Bad', areaAcres: 5, status: 'INVALID' } },
  { name: 'V05 worker rejects missing wage', url: '/api/workers', data: { name: 'Bad' } },
  { name: 'V06 worker rejects nonnumeric wage', url: '/api/workers', data: { name: 'Bad', dailyWageRate: 'oops' } },
  { name: 'V07 worker rejects negative wage', url: '/api/workers', data: { name: 'Bad', dailyWageRate: -1 } },
  { name: 'V08 worker rejects blank name', url: '/api/workers', data: { name: ' ', dailyWageRate: 800 } },
  { name: 'V09 expense rejects zero', url: '/api/expenses', data: { amount: 0, date, description: 'Bad' } },
  { name: 'V10 expense rejects negative amount', url: '/api/expenses', data: { amount: -1, date, description: 'Bad' } },
  { name: 'V11 expense rejects nonnumeric amount', url: '/api/expenses', data: { amount: 'oops', date, description: 'Bad' } },
  { name: 'V12 expense rejects invalid date', url: '/api/expenses', data: { amount: 100, date: 'not-a-date', description: 'Bad' } },
  { name: 'V13 expense rejects unknown category', url: '/api/expenses', data: { category: 'INVALID', amount: 100, date, description: 'Bad' } },
  { name: 'V14 expense rejects missing description', url: '/api/expenses', data: { amount: 100, date } },
  { name: 'V15 sale rejects zero quantity', url: '/api/sales/crop', data: { items: [{ itemName: 'Tomato', quantity: 0, pricePerUnit: 100 }] } },
  { name: 'V16 sale rejects negative rate', url: '/api/sales/crop', data: { items: [{ itemName: 'Tomato', quantity: 1, pricePerUnit: -100 }] } },
  { name: 'V17 sale requires invoice lines', url: '/api/sales/crop', data: { items: [] } },
  { name: 'V18 godown rejects negative received stock', url: '/api/godown/items', data: { name: 'Bad', quantity: -10, ratePerUnit: 20 } },
  { name: 'V19 godown rejects negative rate', url: '/api/godown/items', data: { name: 'Bad', quantity: 10, ratePerUnit: -20 } },
  { name: 'V20 catalog rejects negative stock', url: '/api/operation-items', data: { name: 'Bad', currentStock: -10 } },
  { name: 'V21 catalog rejects negative rate', url: '/api/operation-items', data: { name: 'Bad', defaultRate: -10 } },
  { name: 'V22 crop cycle rejects nonexistent plot', url: '/api/crop-cycles', data: { plotId: 'missing', cropName: 'Tomato', sowingDate: date, expectedHarvestDate: '2027-02-01' } },
  { name: 'V23 crop cycle rejects reversed dates', url: '/api/crop-cycles', data: { plotId: 'missing', cropName: 'Tomato', sowingDate: '2027-02-01', expectedHarvestDate: date } },
  { name: 'V24 daily work rejects nonexistent plot', url: '/api/daily-log', data: { plotId: 'missing', date } },
  { name: 'V25 daily work rejects invalid date', url: '/api/daily-log', data: { plotId: 'missing', date: 'invalid' } },
  { name: 'V26 petty cash rejects negative top-up', url: '/api/expenses/petty-cash', data: { amount: -100, date } },
  { name: 'V27 petty cash rejects nonnumeric top-up', url: '/api/expenses/petty-cash', data: { amount: 'oops', date } },
  { name: 'V28 voucher rejects invalid route type', url: '/api/vouchers/invalid', data: { quantity: 10, cost: 100 } },
  { name: 'V29 employee requires name and wage fields', url: '/api/employees', data: {} },
];
test.describe('validation at real HTTP boundaries', () => {
  for (const sample of cases) {
    test(sample.name, async ({ request }) => {
      let data = sample.data;
      if (sample.name.startsWith('V23 ') || sample.name.startsWith('V25 ')) {
        const plot = await (await request.post('/api/plots', { data: { name: 'Validation Plot', areaAcres: 5 } })).json();
        data = { ...(sample.data as Record<string, unknown>), plotId: plot.id };
      }
      const response = await request.post(sample.url, { data });
      expect([400, 422], `${sample.url} returned ${response.status()}: ${await response.text()}`).toContain(response.status());
    });
  }
  for (const url of ['/api/workers', '/api/expenses', '/api/plots']) {
    test(`malformed JSON is a client error at ${url}`, async ({ request }) => {
      const response = await request.post(url, { data: Buffer.from('{'), headers: { 'Content-Type': 'application/json' } });
      expect([400, 422], `actual status: ${response.status()}`).toContain(response.status());
    });
  }
  test('V33 expense updates enforce the create-time amount rule', async ({ request }) => {
    const created = await (await request.post('/api/expenses', { data: { category: 'GENERAL', amount: 100, date, description: 'Tools' } })).json();
    const response = await request.put('/api/expenses', { data: { id: created.data.id, amount: -100 } });
    expect([400, 422]).toContain(response.status());
  });
  test('V34 attendance rejects invalid status values', async ({ request }) => {
    const worker = await (await request.post('/api/employees', { data: { name: 'A', status: 'ACTIVE', wageType: 'DAILY', wageRate: 800 } })).json();
    const response = await request.post('/api/workers/attendance', { data: { workerId: worker.id, date, status: 'INVALID' } });
    expect([400, 422]).toContain(response.status());
  });
  test('V35 wage payments reject negative amounts', async ({ request }) => {
    const worker = await (await request.post('/api/employees', { data: { name: 'A', status: 'ACTIVE', wageType: 'DAILY', wageRate: 800 } })).json();
    const entry = await (await request.post('/api/workers/attendance', { data: { workerId: worker.id, date, status: 'PRESENT' } })).json();
    const response = await request.post('/api/workers/wages', { data: { wageId: entry.wage.id, paidAmount: -100 } });
    expect([400, 422]).toContain(response.status());
  });
  test('V36 invalid employee submission cannot break the worker-list API', async ({ request }) => {
    await request.post('/api/employees', { data: {} });
    const response = await request.get('/api/workers');
    expect(response.status(), 'Worker listing must remain available after a bad employee submission').toBe(200);
  });
});
