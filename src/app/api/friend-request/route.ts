import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: 'supabase' });
  const { senderId, senderUsername, receiverId, receiverUsername } =
    await req.json();

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
    // Create friend request using Clerk IDs directly
    const { data, error } = await supabase.from('friend_requests').insert([{
      sender_id: senderId,
      sender_username: senderUsername,
      receiver_id: receiverId,
      receiver_username: receiverUsername,
      status: 'pending'
    }]);

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
