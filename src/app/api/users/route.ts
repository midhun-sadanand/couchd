import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

// Enable ISR with 15 minute revalidation
export const revalidate = 900;
export const dynamic = 'force-cache';

export async function GET() {
  try {
    // Fetch all users from Supabase profiles table
    const { data: users, error } = await supabase.from('profiles').select('id, username, avatar_url, bio');
    if (error) throw error;
    
    const response = NextResponse.json(users);
    response.headers.set('Cache-Control', 'public, s-maxage=900, stale-while-revalidate=1800');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=900');
    
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
