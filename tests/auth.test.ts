import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scryptSync } from 'node:crypto';
import { NextRequest } from 'next/server';
import { createSession, readSession, SESSION_COOKIE, verifyCredentials } from '../src/lib/auth';
import { proxy } from '../src/proxy';
const password = 'Test-only-long-password!';
beforeEach(() => {
  vi.stubEnv('ESTATE_ADMIN_USERNAME', 'Admin');
  vi.stubEnv('ESTATE_ADMIN_PASSWORD_HASH', `test-salt:${scryptSync(password, 'test-salt', 64).toString('hex')}`);
  vi.stubEnv('ESTATE_SESSION_SECRET', 'test-only-secret-with-at-least-thirty-two-characters');
});
afterEach(() => vi.unstubAllEnvs());
describe('server credentials and signed sessions', () => {
  it('verifies the configured password hash', () => {
    expect(verifyCredentials('Admin', password)).toBe(true);
    expect(verifyCredentials('Admin', 'wrong')).toBe(false);
    expect(verifyCredentials('Other', password)).toBe(false);
    expect(verifyCredentials(null, password)).toBe(false);
  });
  it('fails closed if authentication is not configured', () => {
    vi.stubEnv('ESTATE_SESSION_SECRET', '');
    expect(() => createSession('Admin')).toThrow();
    expect(readSession('anything')).toBeNull();
  });
  it('rejects expired, modified and unsigned sessions', () => {
    const issued = createSession('Admin', 1000);
    expect(readSession(issued, 1001)?.role).toBe('ADMIN');
    expect(readSession(issued, 1000 + 8 * 60 * 60 * 1000)).toBeNull();
    expect(readSession(`${issued}x`, 1001)).toBeNull();
    expect(readSession(issued.split('.')[0], 1001)).toBeNull();
    expect(readSession('true')).toBeNull();
  });
});
describe('request access control', () => {
  it('throttles repeated sign-in failures despite spoofed IP headers', async () => {
    vi.resetModules();
    const { POST } = await import('../src/app/api/auth/login/route');
    for (let attempt = 0; attempt < 10; attempt++) {
      const response = await POST(new NextRequest('http://localhost/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `192.0.2.${attempt}` }, body: JSON.stringify({ username: 'Admin', password: 'wrong' }) }));
      expect(response.status).toBe(401);
    }
    const limited = await POST(new NextRequest('http://localhost/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.1' }, body: JSON.stringify({ username: 'Admin', password }) }));
    expect(limited.status).toBe(429);
  });
  it.each(['/api/employees', '/api/settings/reset', '/api/sales/crop.svg'])('blocks unauthenticated %s', async path => {
    expect((await proxy(new NextRequest(`http://localhost${path}`))).status).toBe(401);
  });
  it('does not trust the old authentication cookie', async () => {
    const result = await proxy(new NextRequest('http://localhost/workers', { headers: { Cookie: 'estate_authenticated=true' } }));
    expect(result.status).toBe(307);
  });
  it('accepts valid sessions and rejects cross-site mutations', async () => {
    const cookie = `${SESSION_COOKIE}=${createSession('Admin')}`;
    expect((await proxy(new NextRequest('http://localhost/api/workers', { headers: { Cookie: cookie } }))).status).toBe(200);
    expect((await proxy(new NextRequest('http://localhost/api/settings/reset', { method: 'POST', headers: { Cookie: cookie, Origin: 'https://other.example' } }))).status).toBe(403);
  });
  it.each(['{', 'null', '[]', '"text"'])('rejects malformed or non-object JSON %s', async body => {
    const cookie = `${SESSION_COOKIE}=${createSession('Admin')}`;
    const result = await proxy(new NextRequest('http://localhost/api/plots', { method: 'POST', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body }));
    expect(result.status).toBe(400);
  });
});
