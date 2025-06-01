import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/server';

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
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
      .select('user_id, profiles:user_id (id, username, avatar_url)')
      .eq('watchlist_id', profile.id);

    if (sharedError) throw sharedError;

    return NextResponse.json(sharedUsers?.map(item => item.profiles) || []);
  } catch (error) {
    console.error('Error fetching shared users:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 