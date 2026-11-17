import { createHmac,scryptSync,timingSafeEqual } from 'node:crypto';
export const SESSION_COOKIE = 'estate_session';
export const SESSION_SECONDS = 8 * 60 * 60;
export interface Session { username: string; role: 'ADMIN'; expiresAt: number }
function secret() {
  const value = process.env.ESTATE_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('Server authentication is not configured.');
  // Password rotation also invalidates previously issued sessions.
  return createHmac('sha256', value).update(process.env.ESTATE_ADMIN_PASSWORD_HASH || '').digest('hex');
}
function equal(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function verifyCredentials(username: unknown, password: unknown): boolean {
  const configured = process.env.ESTATE_ADMIN_PASSWORD_HASH;
  if (!configured) throw new Error('Server authentication is not configured.');
  secret();
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 1024) return false;
  const [salt, hash] = configured.split(':');
  if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) throw new Error('Invalid server authentication configuration.');
  const candidate = scryptSync(password, salt, 64).toString('hex');
  return equal(username, process.env.ESTATE_ADMIN_USERNAME || 'Admin') && equal(candidate, hash);
}
export function createSession(username: string, now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ username, role: 'ADMIN', expiresAt: now + SESSION_SECONDS * 1000 })).toString('base64url');
  return `${payload}.${createHmac('sha256', secret()).update(payload).digest('base64url')}`;
}
export function readSession(token: string | undefined, now = Date.now()): Session | null {
  if (!token || token.length > 2048) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2 || !equal(parts[1], createHmac('sha256', secret()).update(parts[0]).digest('base64url'))) return null;
    const session = JSON.parse(Buffer.from(parts[0], 'base64url').toString()) as Session;
    return session.username === (process.env.ESTATE_ADMIN_USERNAME || 'Admin') && session.role === 'ADMIN' && Number.isFinite(session.expiresAt) && session.expiresAt > now ? session : null;
  } catch { return null; }
}
