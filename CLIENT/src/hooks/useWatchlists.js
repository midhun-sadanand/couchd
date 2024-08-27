import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabaseClient';

export const fetchWatchlists = async ({ queryKey }) => {
  const userId = queryKey[1];

  const { data: ownedWatchlists, error: ownedError } = await supabase
    .from('watchlist_ownership')
    .select('watchlist_id, user_id')
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

  const ownedWatchlistIds = ownedWatchlists.map(item => item.watchlist_id);
  const sharedWatchlistIds = sharedWatchlists.map(item => item.watchlist_id);
  const allWatchlistIds = [...new Set([...ownedWatchlistIds, ...sharedWatchlistIds])];

  if (allWatchlistIds.length === 0) {
    return { watchlists: [], ownerIds: [] };
  }

  const { data: watchlists, error: watchlistsError } = await supabase
    .from('watchlists')
    .select('*')
    .in('id', allWatchlistIds);

  if (watchlistsError) {
    throw watchlistsError;
  }

  const ownerships = [
    ...ownedWatchlists.map(item => ({ watchlist_id: item.watchlist_id, user_id: item.user_id })),
    ...sharedWatchlists.map(item => {
      const ownership = ownedWatchlists.find(ow => ow.watchlist_id === item.watchlist_id);
      return ownership ? { watchlist_id: item.watchlist_id, user_id: ownership.user_id } : null;
    }).filter(Boolean)
  ];

  const ownerIds = [...new Set(ownerships.map(item => item.user_id))];

  // Ensure tags are parsed and are arrays
  watchlists.forEach(watchlist => {
    if (typeof watchlist.tags === 'string') {
      watchlist.tags = JSON.parse(watchlist.tags);
    }
    if (!Array.isArray(watchlist.tags)) {
      watchlist.tags = [];
    }
  });

  return { watchlists, ownerships, ownerIds };
};

export const useWatchlists = (userId) => {
  return useQuery({
    queryKey: ['watchlists', userId],
    queryFn: fetchWatchlists,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
