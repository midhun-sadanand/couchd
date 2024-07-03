import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabaseClient';

export const fetchWatchlists = async ({ queryKey }) => {
  const userId = queryKey[1];
  
  const { data: ownedWatchlists, error: ownedError } = await supabase
    .from('watchlist_ownership')
    .select('watchlist_id')
    .eq('user_id', userId);

  if (ownedError) {
    throw ownedError;
  }

  const { data: sharedWatchlists, error: sharedError } = await supabase
    .from('watchlist_sharing')
    .select('watchlist_id')
    .eq('shared_with_user_id', userId);

  if (sharedError) {
    throw sharedError;
  }

  const allWatchlistIds = [
    ...new Set([...ownedWatchlists.map(item => item.watchlist_id), ...sharedWatchlists.map(item => item.watchlist_id)]),
  ];

  if (allWatchlistIds.length === 0) {
    return [];
  }

  const { data: watchlists, error: watchlistsError } = await supabase
    .from('watchlists')
    .select('*')
    .in('id', allWatchlistIds);

  if (watchlistsError) {
    throw watchlistsError;
  }

  // Ensure tags are parsed and are arrays
  watchlists.forEach(watchlist => {
    if (typeof watchlist.tags === 'string') {
      watchlist.tags = JSON.parse(watchlist.tags);
    }
    if (!Array.isArray(watchlist.tags)) {
      watchlist.tags = [];
    }
  });

  return watchlists;
};

export const useWatchlists = (userId) => {
  return useQuery({
    queryKey: ['watchlists', userId],
    queryFn: fetchWatchlists,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
