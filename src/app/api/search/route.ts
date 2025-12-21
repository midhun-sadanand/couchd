import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

// Enable ISR with 1 minute revalidation (search results can be cached briefly)
export const revalidate = 60;

export async function GET(req: NextRequest) {
  const query = new URL(req.url).searchParams.get('query')?.toLowerCase() || '';

  try {
    // Search users in Supabase profiles table
    const { data: users, error } = await supabase.from('profiles').select('*');
    if (error) throw error;
    const filtered = users.filter(
      (u: any) => (u.username && u.username.toLowerCase().includes(query)) || (u.email && u.email.toLowerCase().includes(query))
    );
    
    const response = NextResponse.json(filtered);
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
