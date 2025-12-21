import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

// Enable ISR with 2 minute revalidation (friend requests need to be relatively fresh)
export const revalidate = 120;

export async function GET(req: NextRequest) {
  try {
    const { data: friendRequests, error } = await supabase
      .from('friend_requests')
      .select(`
        *,
        sender:profiles!sender_id (id, username),
        receiver:profiles!receiver_id (id, username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const response = NextResponse.json(friendRequests);
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=240');
    
    return response;
  } catch (err: any) {
    console.error('Error fetching friend requests:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { receiverId } = await req.json();

    const { data: friendRequest, error } = await supabase
      .from('friend_requests')
      .insert([
        {
          receiver_id: receiverId,
          status: 'pending',
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(friendRequest);
  } catch (err: any) {
    console.error('Error creating friend request:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
