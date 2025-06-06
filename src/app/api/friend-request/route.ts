import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  const { senderId, senderUsername, receiverId, receiverUsername } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Create friend request using Supabase Auth user IDs directly
    const { data, error } = await supabase.from('friend_requests').insert([{
      sender_id: senderId,
      sender_username: senderUsername,
      receiver_id: receiverId,
      receiver_username: receiverUsername,
      status: 'pending'
    }]);

    if (error) throw error;

    return new Response(JSON.stringify(data), { status: 201 });
  } catch (error) {
    console.error('Error creating friend request:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), { status: 500 });
  }
}
