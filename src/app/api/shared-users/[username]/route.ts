import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const supabase = createClient(
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', params.username)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return new NextResponse('Profile not found', { status: 404 });
      }
      throw profileError;
    }

    const { data: sharedUsers, error: sharedError } = await supabase
      .from('shared_watchlists')
      .select('user_id, profiles:user_id (id, username)')
      .eq('watchlist_id', profile.id);

    if (sharedError) throw sharedError;

    return NextResponse.json(sharedUsers?.map(item => item.profiles) || []);
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 