import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

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

    return NextResponse.json(profile);
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 