// middleware.ts — minimal auth guard using Supabase auth cookie
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api', '/_next', '/favicon.ico'];

// Helper: decode JWT payload without verifying (we only extract 'sub' claim)
function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next();

  // access token stored by Supabase in cookie
  const token = req.cookies.get('sb-access-token')?.value || req.cookies.get('supabase-auth-token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Extract user id (sub) from token payload
  const payload = decodeJwtPayload(token);
  const userId = payload?.sub;
  if (!userId) return NextResponse.redirect(new URL('/login', req.url));

  // Verify user exists in `users` table and has role 'Admin'
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    // Service role key required for admin verification. Deny access if missing to avoid accidental public access.
    console.warn('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL not set — denying access');
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/users?auth_uid=eq.${userId}&select=role`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      console.warn('supabase users lookup failed', await res.text());
      return NextResponse.redirect(new URL('/login', req.url));
    }
    const rows = await res.json();
    const isAdmin = Array.isArray(rows) && rows.length > 0 && rows[0].role === 'Admin';
    if (!isAdmin) return NextResponse.redirect(new URL('/login', req.url));
  } catch (e) {
    console.warn('admin verification failed', e);
    return NextResponse.redirect(new URL('/login', req.url));
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
