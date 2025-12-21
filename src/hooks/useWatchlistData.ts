import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '../utils/auth';

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  image?: string | null;
}

export function useWatchlistData(watchlistId: string) {
  const supabase = useSupabaseClient();

  return useQuery<Watchlist | null, Error>({
    queryKey: ['watchlist', watchlistId],
    queryFn: async () => {
      if (!watchlistId || !supabase) return null;

      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .eq('id', watchlistId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!watchlistId && !!supabase,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

// Helper to invalidate watchlist data cache
export function useInvalidateWatchlistData() {
  const queryClient = useQueryClient();
  return (watchlistId?: string) => {
    if (watchlistId) {
      queryClient.invalidateQueries({ queryKey: ['watchlist', watchlistId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    }
  };
}
