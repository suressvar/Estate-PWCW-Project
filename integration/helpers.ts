import { expect, type APIRequestContext, type BrowserContext } from '@playwright/test';
export const testCredentials = { username: 'Admin', password: 'Integration-Test-Password-Only-2026!' };
export async function signIn(request: APIRequestContext) {
  expect((await request.post('/api/auth/login', { data: testCredentials })).status()).toBe(200);
}
export async function browserSignIn(context: BrowserContext) { await signIn(context.request); }
export async function resetTestData(request: APIRequestContext) {
  await signIn(request);
  expect((await request.post('/api/settings/reset')).status()).toBe(200);
}
