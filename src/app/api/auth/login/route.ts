import { createSession,SESSION_COOKIE,SESSION_SECONDS,verifyCredentials } from '@/lib/auth';
import { readLimitedBody, RequestSizeError } from '@/lib/request-body';
import { NextRequest,NextResponse } from 'next/server';
const attempts = new Map<string, { count: number; until: number }>();
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return NextResponse.json({ error: 'Cross-site sign-in is not allowed.' }, { status: 403 });
  // A single configured account: do not trust a client-supplied proxy/IP header.
  const key = 'administrator';
  const now = Date.now();
  for (const [ip, value] of attempts) if (value.until <= now) attempts.delete(ip);
  const previous = attempts.get(key);
  if (previous && previous.count >= 10) return NextResponse.json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, { status: 429 });
  try {
    const raw = await readLimitedBody(request, 8192);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || typeof body.username !== 'string' || body.username.length > 128 || typeof body.password !== 'string' || !body.username.trim() || !body.password) return NextResponse.json({ error: 'Please enter both username and password.' }, { status: 400 });
    if (!verifyCredentials(body.username, body.password)) {
      attempts.set(key, { count: (previous?.count || 0) + 1, until: previous?.until || now + 15 * 60 * 1000 });
      return NextResponse.json({ error: 'Invalid username or password.' }, { status: 401 });
    }
    attempts.delete(key);
    const response = NextResponse.json({ success: true, username: body.username, role: 'ADMIN' });
    response.cookies.set(SESSION_COOKIE, createSession(body.username), { httpOnly: true, secure: request.nextUrl.protocol === 'https:', sameSite: 'strict', path: '/', maxAge: SESSION_SECONDS });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    if (error instanceof RequestSizeError) return NextResponse.json({ error: 'Sign-in request is too large.' }, { status: 413 });
    return NextResponse.json({ error: error instanceof SyntaxError ? 'Invalid JSON request.' : 'Sign-in is unavailable. Check the server authentication configuration.' }, { status: error instanceof SyntaxError ? 400 : 503 });
  }
}
