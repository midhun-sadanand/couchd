import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function GET(req: NextRequest) {
  const receiverId = new URL(req.url).searchParams.get('receiverId');

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', receiverId)
    .eq('status', 'pending');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
