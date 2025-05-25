// src/lib/updateCounters.ts
import { supabase } from './server';

export async function updateMediaItemCounters(watchlistId: number) {
  const { data: counts, error } = await supabase
    .from('media_items')
    .select('status, count:status')
    .eq('watchlist_id', watchlistId)
    .group('status');

  if (error) throw error;

  const toConsume   = counts.find(c => c.status === 'to consume')?.count ?? 0;
  const consuming   = counts.find(c => c.status === 'consuming')?.count ?? 0;
  const consumed    = counts.find(c => c.status === 'consumed')?.count  ?? 0;

  const { error: upErr } = await supabase
    .from('watchlists')
    .update({
      to_consume_count: toConsume,
      consuming_count : consuming,
      consumed_count  : consumed
    })
    .eq('id', watchlistId);

  if (upErr) throw upErr;
}
