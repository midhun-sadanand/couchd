import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  const { getToken } = getAuth(req);
  const token = await getToken({ template: 'supabase' });
  const receiverId = new URL(req.url).searchParams.get('receiverId');

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

  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('receiver_id', receiverId)
    .eq('status', 'pending');

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
