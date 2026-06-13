'use server';

import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function loginAction(email: string, password: string): Promise<{ error?: string }> {
  if (!SUPABASE_URL || !ANON_KEY) {
    return { error: 'Server configuration error' };
  }

  // Use anon key for auth (not service role)
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok || !data.access_token) {
    return { error: data.error_description || data.msg || 'Invalid credentials' };
  }

  // Set cookies with secure flags (server-side only)
  const cookieStore = await cookies();
  const maxAge = 60 * 60 * 24; // 24 hours

  cookieStore.set('sb-access-token', data.access_token, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    secure: true,
    // httpOnly: true, // Enable when middleware can read httpOnly cookies
  });

  cookieStore.set('supabase-auth-token', data.access_token, {
    path: '/',
    maxAge,
    sameSite: 'lax',
    secure: true,
    // httpOnly: true,
  });

  return {};
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('supabase-auth-token');
}
