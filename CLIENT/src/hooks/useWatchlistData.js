import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabaseClient';

const fetchWatchlistData = async ({ queryKey }) => {
  const watchlistId = queryKey[1];
  const { data: watchlist, error } = await supabase
    .from('watchlists')
    .select('id, name, is_public, image, description, shared_with')
    .eq('id', watchlistId)
    .single();

  if (error) {
    throw error;
  }

  return watchlist;
};

export const useWatchlistData = (watchlistId) => {
  return useQuery({
    queryKey: ['watchlistData', watchlistId],
    queryFn: fetchWatchlistData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
