import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { senderId, senderUsername, receiverId, receiverUsername } =
    await req.json();

  const { data, error } = await supabase.from('friend_requests').insert([{
    sender_id   : senderId,
    sender_username : senderUsername,
    receiver_id : receiverId,
    receiver_username : receiverUsername,
    status      : 'pending'
  }]);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
