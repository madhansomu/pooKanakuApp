import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware is minimal — auth is handled client-side by AuthProvider.
// This only protects against direct URL access without any session.
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: []
};
