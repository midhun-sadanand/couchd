import { withClerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Create profile in Supabase when user signs up
async function createProfile(userId: string, username: string | null) {
  try {
    console.log('Middleware Debug - Attempting to create profile:', {
      userId,
      username,
      timestamp: new Date().toISOString()
    });

    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    console.log('Middleware Debug - Profile check result:', {
      existingProfile,
      fetchError,
      timestamp: new Date().toISOString()
    });

    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,  // Use Clerk ID directly as text
          username: username || `user_${userId.slice(0, 8)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      console.log('Middleware Debug - Profile creation result:', {
        newProfile,
        insertError,
        timestamp: new Date().toISOString()
      });

      if (insertError) {
        console.error('Middleware Error - Failed to create profile:', {
          error: insertError,
          userId,
          timestamp: new Date().toISOString()
        });
      }
    }
  } catch (error) {
    console.error('Middleware Error - Profile creation failed:', {
      error,
      userId,
      timestamp: new Date().toISOString()
    });
  }
}

export default withClerkMiddleware(async (request: NextRequest) => {
  const { userId, user } = getAuth(request);
  
  console.log('Middleware Debug - Request details:', {
    path: request.nextUrl.pathname,
    userId,
    username: user?.username,
    timestamp: new Date().toISOString()
  });
  
  // Handle profile creation for new users
  if (userId) {
    await createProfile(userId, user?.username || null);
  }
  
  return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
