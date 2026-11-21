import { readSession,SESSION_COOKIE } from '@/lib/auth';
import { readLimitedBody, RequestSizeError } from '@/lib/request-body';
import { NextResponse,type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (pathname === '/api/auth/login') return NextResponse.next();
  if (pathname === '/login') return session ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next();
  if (!session) return pathname.startsWith('/api/')
    ? NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
    : NextResponse.redirect(new URL('/login', request.url));
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if ((origin && origin !== request.nextUrl.origin) || request.headers.get('sec-fetch-site') === 'cross-site') {
      return NextResponse.json({ error: 'Cross-site changes are not allowed.' }, { status: 403 });
    }
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        const text = await readLimitedBody(request.clone(), 1024 * 1024);
        if (text.length > 0) {
          if (!request.headers.get('content-type')?.includes('application/json')) return NextResponse.json({ error: 'Use an application/json request.' }, { status: 415 });
          const body = JSON.parse(text);
          if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Expected an object');
        }
      } catch (error) { return NextResponse.json({ error: error instanceof RequestSizeError ? 'Request is too large.' : 'A valid JSON object is required.' }, { status: error instanceof RequestSizeError ? 413 : 400 }); }
    }
  }
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  return response;
}
export const config = { matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
