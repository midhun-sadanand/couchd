import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: 'supabase' });
  const { requestId } = await req.json();

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
    // Update friend request status
    const { data: request, error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    const { sender_id, receiver_id } = request;

    // Create bidirectional friend relationship using Clerk IDs directly
    const [senderResult, receiverResult] = await Promise.all([
      supabase.from('friends').insert([{
        user_id: sender_id,
        friend_id: receiver_id,
        created_at: new Date().toISOString()
      }]),
      supabase.from('friends').insert([{
        user_id: receiver_id,
        friend_id: sender_id,
        created_at: new Date().toISOString()
      }])
    ]);

    if (senderResult.error) throw senderResult.error;
    if (receiverResult.error) throw receiverResult.error;

    // Delete the friend request
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ 
      sender: senderResult.data,
      receiver: receiverResult.data
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
