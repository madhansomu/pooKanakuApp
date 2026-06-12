import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api', '/_next', '/favicon.ico', '/manifest.json', '/icons'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  // Check for any Supabase auth cookie (sb-<ref>-auth-token or legacy names)
  const hasToken = [...req.cookies].some(([name]) =>
    name.startsWith('sb-') && name.endsWith('-auth-token')
  ) || req.cookies.has('sb-access-token')
    || req.cookies.has('supabase-auth-token');

  if (!hasToken) {
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
