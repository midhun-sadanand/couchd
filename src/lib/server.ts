// src/lib/server.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseAnonKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!supabaseServiceRoleKey) {
  throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
}

// Create a function to get an authenticated Supabase client
export async function getAuthenticatedSupabaseClient(userId: string) {
  try {
    // For server-side operations, we'll use the service role key
    return createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    throw error;
  }
}

// Create a default Supabase client for server-side operations
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

// Keep the service role client for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey
);

// Debug logging for clients
console.log('Supabase Clients:', {
  supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceRoleKey
});

export { supabaseServiceRoleKey, supabaseUrl, supabaseAnonKey };
