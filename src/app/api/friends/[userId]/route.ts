import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: 'supabase' });
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

  try {
    // First get the profile ID from id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', params.userId)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
      throw profileError;
    }

    // Then get the friends using the profile ID
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('friend_id, profiles:friend_id (id, username)')
      .eq('user_id', profile.id);

    if (friendsError) {
      throw friendsError;
    }

    return NextResponse.json(friends?.map(friend => friend.profiles) || []);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
