// src/lib/server.ts
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/clerk-sdk-node';

// Create a function to get an authenticated Supabase client
export async function getAuthenticatedSupabaseClient(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId);
    const token = await user.getToken({ template: 'supabase' });
    
    // Debug logging
    console.log('Server-side Supabase Client:', {
      userId,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

    return createClient(
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
  } catch (error) {
    console.error('Error creating authenticated Supabase client:', error);
    throw error;
  }
}

// Keep the service role client for admin operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Debug logging for admin client
console.log('Supabase Admin Client:', {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
});

export { clerkClient };
