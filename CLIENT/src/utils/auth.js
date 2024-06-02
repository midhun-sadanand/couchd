import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useSession } from '@clerk/clerk-react';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Context to hold the Supabase client and its loading state
export const SupabaseContext = createContext({ client: null, isLoading: true });

export const SupabaseProvider = ({ children }) => {
  const { session } = useSession();
  const [supabase, setSupabase] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // State to track loading of Supabase client

  useEffect(() => {
    if (session) {
      setIsLoading(true); // Start loading
      const supabaseClient = createClient(
        supabaseUrl, supabaseAnonKey, {
          global: {
            fetch: async (url, options = {}) => {
              const clerkToken = await session.getToken({ template: 'supabase' });
              const headers = new Headers(options.headers);
              headers.set('Authorization', `Bearer ${clerkToken}`);
              return fetch(url, { ...options, headers });
            }
          }
        }
      );
      setSupabase(supabaseClient);
      setIsLoading(false); // End loading
    } else {
      setSupabase(null);
      setIsLoading(false);
    }
  }, [session]);

  return (
    <SupabaseContext.Provider value={{ client: supabase, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseClient = () => {
  const { client, isLoading } = useContext(SupabaseContext);
  if (isLoading) {
    throw new Error("Supabase client is initializing. Please check loading state before using this hook.");
  }
  if (!client) {
    throw new Error("useSupabaseClient must be used within a SupabaseProvider and after it has fully initialized.");
  }
  return client;
};
