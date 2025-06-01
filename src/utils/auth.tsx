'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/* ------------------------------------------------------------------ */
/*  Context types                                                     */
/* ------------------------------------------------------------------ */

interface SupabaseContextType {
  client: SupabaseClient | null;
  isLoading: boolean;
}

const defaultContext: SupabaseContextType = {
  client: null,
  isLoading: true,
};

export const SupabaseContext =
  createContext<SupabaseContextType>(defaultContext);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const { session, isLoaded } = useSession();
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------------- Create (or clear) the client when session changes ---- */
  useEffect(() => {
    if (!isLoaded) return;
    if (!session) {
      setClient(null);
      setIsLoading(false);
      return;
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: async (url, options: RequestInit = {}) => {
          /* Inject Clerk-issued Supabase JWT */
          const token = await session.getToken({ template: 'supabase' });
          if (!token) {
            console.error('Missing Clerk→Supabase token');
            throw new Error('No Supabase token');
          }
          const headers = new Headers(options.headers);
          headers.set('Authorization', `Bearer ${token}`);
          return fetch(url, { ...options, headers });
        },
      },
    });
    setClient(supabase);
    setIsLoading(false);
  }, [isLoaded, session]);

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
  const { client, isLoading } = useSupabase();
  return isLoading ? null : client;
}
