'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/database';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setInitialized, setLoading, initialized, user } = useAuthStore();

  const isLoginPage = pathname?.startsWith('/login');

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        if (!isLoginPage) {
          router.replace('/login');
        }
        return;
      }

      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('auth_uid', session.user.id)
        .maybeSingle();

      if (userRow) {
        setUser(userRow as User);
      } else {
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            auth_uid: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
            role: 'Admin',
            is_super: true,
          })
          .select()
          .single();

        if (newUser) {
          setUser(newUser as User);
        } else {
          setUser(null);
          if (!isLoginPage) {
            router.replace('/login');
          }
        }
      }
    } catch (err) {
      console.error('AuthProvider: failed to load user', err);
      setUser(null);
      if (!isLoginPage) {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, router, isLoginPage]);

  useEffect(() => {
    if (initialized) return;

    loadUser().then(() => setInitialized());

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          if (!isLoginPage) {
            router.replace('/login');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialized, loadUser, setInitialized, setUser, router, isLoginPage]);

  // Don't render protected content while checking auth
  if (!initialized && !isLoginPage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
      }}>
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌺</div>
          <div style={{ fontSize: '0.875rem' }}>Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (and not on login page)
  if (!user && !isLoginPage && initialized) {
    return null;
  }

  return <>{children}</>;
}
