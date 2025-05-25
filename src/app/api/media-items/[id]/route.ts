import { NextResponse } from 'next/server';
import { supabase } from '@/lib/server';
import { updateMediaItemCounters } from '@/lib/updateCounters';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('media_items')
    .delete()
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await updateMediaItemCounters(data.watchlist_id);
  return NextResponse.json(data);
}
