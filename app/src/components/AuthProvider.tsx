'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/database';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setInitialized, setLoading, initialized } = useAuthStore();

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
        // Auto-create user row if missing
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

        setUser(newUser ? (newUser as User) : null);
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

    return () => subscription.unsubscribe();
  }, [initialized, loadUser, setInitialized, setUser, router, isLoginPage]);

  // Always render children — redirect handles auth
  return <>{children}</>;
}
