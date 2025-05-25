import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { requestId } = await req.json();
  const { error } = await supabase.from('friend_requests')
                                  .delete()
                                  .eq('id', requestId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
