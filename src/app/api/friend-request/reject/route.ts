import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
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
    // Update friend request status to rejected
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // Delete the friend request
    const { error: deleteError } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (deleteError) throw deleteError;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
