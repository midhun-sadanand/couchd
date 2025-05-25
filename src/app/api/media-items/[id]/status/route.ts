import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';
import { updateMediaItemCounters } from '@/lib/updateCounters';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { status } = await req.json();

  const { data, error } = await supabase
    .from('media_items')
    .update({ status })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await updateMediaItemCounters(data.watchlist_id);
  return NextResponse.json(data);
}
