import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/server';

export async function POST(req: NextRequest) {
  const { watchlistName, description, tags, isPublic, userId } = await req.json();

  const { data: wl, error: wlErr } = await supabase
    .from('watchlists')
    .insert([{
      name        : watchlistName,
      user_id     : userId,
      description ,
      tags        ,
      is_public   : isPublic
    }])
    .select();

  if (wlErr)
    return NextResponse.json({ error: wlErr.message }, { status: 500 });

  const newWatchlist = wl![0];

  const { error: ownErr } = await supabase
    .from('watchlist_ownership')
    .insert([{ user_id: userId, watchlist_id: newWatchlist.id }]);

  if (ownErr)
    return NextResponse.json({ error: ownErr.message }, { status: 500 });

  return NextResponse.json(newWatchlist, { status: 201 });
}
