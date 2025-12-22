'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8) + '...');

/* ------------------------------------------------------------------ */
/*  Context types                                                     */
/* ------------------------------------------------------------------ */

interface SupabaseContextType {
  client: any;
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
  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSupabase = async () => {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        setClient(supabase);
      } catch (error) {
        console.error('Auth Error - Failed to initialize Supabase:', {
          error,
          timestamp: new Date().toISOString()
        });
      } finally {
        setIsLoading(false);
      }
    };
    initializeSupabase();
  }, []);

  // Optionally, keep token fresh if you set long TTL (no-op if not logged in)
  useEffect(() => {
    if (!client) return;
    // refresh every 55 min
    const id = setInterval(() => {
      client.auth.getSession().catch(() => {
        /* swallow – any real failure will appear on next request */
      });
    }, 55 * 60 * 1000);
    return () => clearInterval(id);
  }, [client]);

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

export const useUser = () => {
  const { client: supabase } = useSupabase();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('supabase in useUser', supabase);
    if (!supabase) {
      setLoading(true);
      return;
    }
    
    const fetchUserProfile = async (authUser: any) => {
      if (!authUser) {
        setUser(null);
        return;
      }
      
      try {
        console.log('🔍 Fetching profile for user:', authUser.id, authUser.email);
        // Fetch profile data to get username
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('username, avatar_url, bio')
          .eq('id', authUser.id)
          .single();
        
        console.log('📝 Profile data:', profile, 'Error:', profileError);
        
        // Merge auth user with profile data
        const mergedUser = {
          ...authUser,
          username: profile?.username || authUser.email?.split('@')[0] || 'Guest',
          avatar_url: profile?.avatar_url,
          bio: profile?.bio,
        };
        
        console.log('✅ Final user object:', { id: mergedUser.id, username: mergedUser.username, email: mergedUser.email });
        setUser(mergedUser);
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        // Fallback to auth user with email as username
        const fallbackUser = {
          ...authUser,
          username: authUser.email?.split('@')[0] || 'Guest',
        };
        console.log('⚠️ Using fallback user:', { id: fallbackUser.id, username: fallbackUser.username });
        setUser(fallbackUser);
      }
    };
    
    let subscription: any;
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      fetchUserProfile(session?.user ?? null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      fetchUserProfile(session?.user ?? null);
      setLoading(false);
    });
    subscription = data?.subscription;
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [supabase]);

  return { user, loading };
};

export function useSignOut() {
  const { client: supabase } = useSupabase();
  const router = useRouter();
  return async () => {
    if (supabase) {
      await supabase.auth.signOut();
      console.log('signed out');
      router.push('/');
    }
  };
}
