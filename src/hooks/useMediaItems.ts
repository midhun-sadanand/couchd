import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '../utils/auth';

interface MediaItem {
  id: string;
  title: string;
  type: string;
  tmdb_id: string;
  poster_path: string | null;
  watchlist_id: string;
  created_at: string;
  updated_at: string;
}

export function useMediaItems(watchlistId: string) {
  const supabase = useSupabaseClient();

  return useQuery<MediaItem[], Error>({
    queryKey: ['mediaItems', watchlistId],
    queryFn: async () => {
      if (!watchlistId || !supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('watchlist_id', watchlistId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!watchlistId && !!supabase,
    staleTime: 60 * 60 * 1000, // 60 minutes (1 hour) - ultra-aggressive caching
    gcTime: 4 * 60 * 60 * 1000, // 4 hours - longer cache retention
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Disable refetch on focus
    refetchOnReconnect: false, // Disable refetch on reconnect
  });
}

// Helper to invalidate media items cache
export function useInvalidateMediaItems() {
  const queryClient = useQueryClient();
  return (watchlistId?: string) => {
    if (watchlistId) {
      queryClient.invalidateQueries({ queryKey: ['mediaItems', watchlistId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    }
  };
} 