import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

// Enable ISR with 30 minute revalidation (profiles rarely change)
export const revalidate = 1800;

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .eq('username', params.username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return new NextResponse('Profile not found', { status: 404 });
      }
      throw error;
    }

    const response = NextResponse.json(profile);
    
    // Add aggressive cache headers
    response.headers.set('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=1800');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=1800');

    return response;
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 