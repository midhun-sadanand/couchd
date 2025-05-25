import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { watchlistId, sharedWith } = await req.json();

  const { error: upErr } = await supabase
    .from('watchlists')
    .update({ shared_with: sharedWith })
    .eq('id', watchlistId);

  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  // add missing rows
  for (const uid of sharedWith) {
    const { data, error } = await supabase
      .from('watchlist_sharing')
      .select('*')
      .eq('shared_with_user_id', uid)
      .eq('watchlist_id', watchlistId)
      .single();

    if (error && error.code !== 'PGRST116')
      return NextResponse.json({ error: error.message }, { status: 500 });

    if (!data) {
      const { error: insErr } = await supabase
        .from('watchlist_sharing')
        .insert([{ shared_with_user_id: uid, watchlist_id: watchlistId }]);
      if (insErr)
        return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
  }

  // remove stale rows
  const { data: rows, error: rowsErr } = await supabase
    .from('watchlist_sharing')
    .select('shared_with_user_id')
    .eq('watchlist_id', watchlistId);

  if (rowsErr)
    return NextResponse.json({ error: rowsErr.message }, { status: 500 });

  for (const r of rows) {
    if (!sharedWith.includes(r.shared_with_user_id)) {
      const { error: delErr } = await supabase
        .from('watchlist_sharing')
        .delete()
        .eq('shared_with_user_id', r.shared_with_user_id)
        .eq('watchlist_id', watchlistId);
      if (delErr)
        return NextResponse.json({ error: delErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Watchlist share settings updated' });
}
