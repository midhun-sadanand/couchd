'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useUser, useSession } from '@clerk/nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8) + '...');

/* ------------------------------------------------------------------ */
/*  Context types                                                     */
/* ------------------------------------------------------------------ */

interface SupabaseContextType {
  client: SupabaseClient | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  client: null,
  isLoading: true,
});

export { SupabaseContext };

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoaded: isUserLoaded } = useUser();
  const { session } = useSession();

  useEffect(() => {
    const initializeSupabase = async () => {
      if (!isUserLoaded || !user || !session) {
        console.log('Auth Debug - No user or session loaded yet:', {
          isUserLoaded,
          hasUser: !!user,
          hasSession: !!session,
          timestamp: new Date().toISOString()
        });
        return;
      }

      try {
        const token = await session.getToken({ template: 'supabase' });
        
        console.log('Auth Debug - Token details:', {
          hasToken: !!token,
          tokenLength: token?.length,
          tokenPreview: token ? `${token.substring(0, 10)}...` : null,
          userId: user.id,
          timestamp: new Date().toISOString()
        });

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        // Test the connection with a simple query
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        console.log('Auth Debug - Test query result:', {
          hasData: !!data,
          error: error ? {
            code: error.code,
            message: error.message,
            details: error.details
          } : null,
          userId: user.id,
          timestamp: new Date().toISOString()
        });

        setClient(supabase);
      } catch (error) {
        console.error('Auth Error - Failed to initialize Supabase:', {
          error,
          userId: user.id,
          timestamp: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeSupabase();
  }, [user, isUserLoaded, session]);

  /* ------------- (optional) keep token fresh if you set long TTL ---------- */
  useEffect(() => {
    if (!session) return;

    // refresh every 55 min
    const id = setInterval(() => {
      session.getToken({ template: 'supabase', skipCache: true }).catch(() => {
        /* swallow – any real failure will appear on next request */
      });
    }, 55 * 60 * 1000);

    return () => clearInterval(id);
  }, [session]);

  return (
    <SupabaseContext.Provider value={{ client, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper hooks                                                      */
/* ------------------------------------------------------------------ */

export function useSupabase() {
  return useContext(SupabaseContext);
}

export function useSupabaseClient() {
  const { client } = useSupabase();
  return client;
}

export function clearBrowserCache() {
  if (typeof window !== 'undefined') {
    localStorage.clear();
    sessionStorage.clear();
    console.log('Browser cache cleared (localStorage and sessionStorage)');
  }
}
