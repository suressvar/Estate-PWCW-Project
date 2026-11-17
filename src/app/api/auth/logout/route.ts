import { SESSION_COOKIE } from '@/lib/auth';
import { NextResponse } from 'next/server';
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
