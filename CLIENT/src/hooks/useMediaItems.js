import { useQuery } from '@tanstack/react-query';
import supabase from '../utils/supabaseClient';

const fetchMediaItems = async ({ queryKey }) => {
  const watchlistId = queryKey[1];
  const { data: mediaItems, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('watchlist_id', watchlistId)
    .order('order', { ascending: true });

  if (error) {
    throw error;
  }

  return mediaItems;
};

export const useMediaItems = (watchlistId) => {
  return useQuery({
    queryKey: ['mediaItems', watchlistId],
    queryFn: fetchMediaItems,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
