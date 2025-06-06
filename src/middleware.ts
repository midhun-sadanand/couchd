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

// Helper function to get user session from request
async function getAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return { userId: null, user: null };

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { userId: null, user: null };
    }

    return { userId: user.id, user };
  } catch (error) {
    console.error('Auth error:', error);
    return { userId: null, user: null };
  }
}

// Create profile in Supabase when user signs up
async function createProfile(userId: string) {
  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          username: `user_${userId.slice(0, 8)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      if (insertError) {
        console.error('Middleware Error - Failed to create profile:', insertError);
      }
    }
  } catch (error) {
    console.error('Middleware Error - Profile creation failed:', error);
  }
}

export default async (request: NextRequest) => {
  const { userId } = await getAuth(request);
  if (userId) {
    await createProfile(userId);
  }
  return NextResponse.next();
};

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
