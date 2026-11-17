import { expect,type APIRequestContext,type BrowserContext } from '@playwright/test';
export async function authenticate(target: BrowserContext | APIRequestContext) {
  const request = 'request' in target ? target.request : target;
  const response = await request.post('/api/auth/login', { data: { username: 'Admin', password: 'Integration-Test-Password-Only-2026!' } });
  expect(response.status()).toBe(200);
}
