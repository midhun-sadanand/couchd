import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { requestId } = await req.json();

  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: 'accepted' })
    .eq('id', requestId)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const { sender_id, receiver_id } = data;

  const s = await supabase.rpc('append_friend', {
    p_profile_id: sender_id,
    p_friend_id : receiver_id
  });
  if (s.error)
    return NextResponse.json({ error: s.error.message }, { status: 500 });

  const r = await supabase.rpc('append_friend', {
    p_profile_id: receiver_id,
    p_friend_id : sender_id
  });
  if (r.error)
    return NextResponse.json({ error: r.error.message }, { status: 500 });

  await supabase.from('friend_requests').delete().eq('id', requestId);
  return NextResponse.json({ sender: s.data, receiver: r.data });
}
