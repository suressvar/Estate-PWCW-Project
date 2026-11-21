import { testBaseURL } from './helpers';
import { resetTestData, signIn } from "./helpers";
import { test, expect } from '@playwright/test';
test.beforeEach(async ({ playwright }) => { const setup = await playwright.request.newContext({ baseURL: testBaseURL }); try { await resetTestData(setup); } finally { await setup.dispose(); } });
test.describe('access boundaries on isolated test server', () => {
  test('S01 unauthenticated pages redirect to login', async ({ request }) => {
    const response = await request.get('/workers', { maxRedirects: 0 });
    expect(response.status()).toBe(307); expect(response.headers().location).toContain('/login');
  });
  test('S02 unauthenticated users cannot read employee records', async ({ request }) => {
    const response = await request.get('/api/employees', { maxRedirects: 0 });
    expect([401, 403, 307]).toContain(response.status());
  });
  test('S03 unauthenticated users cannot create workers', async ({ request }) => {
    const response = await request.post('/api/workers', { data: { name: 'Unauthorized', dailyWageRate: 800 }, maxRedirects: 0 });
    expect([401, 403, 307]).toContain(response.status());
  });
  test('S04 unauthenticated users cannot reset application data', async ({ request }) => {
    const response = await request.post('/api/settings/reset', { maxRedirects: 0 });
    expect([401, 403, 307]).toContain(response.status());
  });
  test('S05 a fabricated auth cookie cannot grant page access', async ({ request }) => {
    const response = await request.get('/workers', { headers: { Cookie: 'estate_authenticated=false' }, maxRedirects: 0 });
    expect([401, 403, 307]).toContain(response.status());
  });
  test('S06 API paths with file extensions still require a session', async ({ request }) => {
    expect((await request.get('/api/sales/crop.svg')).status()).toBe(401);
  });
  test('S07 signed-in cross-site writes are rejected', async ({ request }) => {
    await signIn(request);
    expect((await request.post('/api/settings/reset', { headers: { Origin: 'https://untrusted.example' } })).status()).toBe(403);
  });
  test('S08 logout removes browser authentication', async ({ request }) => {
    await signIn(request);
    expect((await request.post('/api/auth/logout')).status()).toBe(200);
    expect((await request.get('/api/employees')).status()).toBe(401);
  });
  test('S09 session cookie is inaccessible to scripts and same-site restricted', async ({ request }) => {
    await signIn(request);
    const state = await request.storageState();
    const cookie = state.cookies.find(item => item.name === 'estate_session');
    expect(cookie?.httpOnly).toBe(true); expect(cookie?.sameSite).toBe('Strict');
  });
});
