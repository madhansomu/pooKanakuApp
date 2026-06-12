import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api', '/_next', '/favicon.ico', '/manifest.json', '/icons'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get('sb-access-token')?.value
    || req.cookies.get('supabase-auth-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/customers/:path*',
    '/flowers/:path*',
    '/supply/:path*',
    '/calendar/:path*',
    '/leaves/:path*',
    '/billing/:path*',
    '/payments/:path*',
    '/expenses/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ]
};
