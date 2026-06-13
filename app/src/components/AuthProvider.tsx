'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import type { User } from '../types/database';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser, setInitialized, setLoading, initialized } = useAuthStore();
  const redirecting = useRef(false);

  const isLoginPage = pathname?.startsWith('/login');

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setUser(null);
        if (!isLoginPage && !redirecting.current) {
          redirecting.current = true;
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

        if (newUser) {
          setUser(newUser as User);
        } else {
          setUser(null);
        }
      }
    } catch (err) {
      console.error('AuthProvider: failed to load user', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, router, isLoginPage]);

  useEffect(() => {
    // Load user on mount
    loadUser().then(() => setInitialized());

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Re-load user when signed in or token refreshed
          await loadUser();
          setInitialized();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setInitialized();
          if (!isLoginPage && !redirecting.current) {
            redirecting.current = true;
            router.replace('/login');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset redirect guard when pathname changes
  useEffect(() => {
    redirecting.current = false;
  }, [pathname]);

  return <>{children}</>;
}
