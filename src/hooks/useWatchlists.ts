import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@/utils/auth';

interface Watchlist {
  id: string;
  name: string;
  description: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  image: string | null;
}

interface WatchlistOwnership {
  user_id: string;
  watchlist_id: string;
}

interface WatchlistData {
  watchlists: Watchlist[];
  ownerships: WatchlistOwnership[];
  ownerIds: string[];
}

export function useWatchlists(userId: string | undefined) {
  const supabase = useSupabaseClient();

  return useQuery<WatchlistData, Error>({
    queryKey: ['watchlists', userId],
    queryFn: async () => {
      if (!userId || !supabase) {
        return { watchlists: [], ownerships: [], ownerIds: [] };
      }

      // Fetch watchlists
      const { data: watchlists, error: watchlistsError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (watchlistsError) {
        throw watchlistsError;
      }

      // Fetch ownerships if watchlists exist
      let ownerships: WatchlistOwnership[] = [];
      if (watchlists && watchlists.length > 0) {
        const validWatchlistIds = watchlists.map((w: Watchlist) => w.id).filter(Boolean);
        if (validWatchlistIds.length > 0) {
          const result = await supabase
            .from('watchlist_ownership')
            .select('user_id, watchlist_id')
            .in('watchlist_id', validWatchlistIds);
          
          if (!result.error) {
            ownerships = result.data || [];
          }
        }
      }

      const ownerIds = [...new Set(ownerships.map((o: WatchlistOwnership) => o.user_id))];

      return {
        watchlists: watchlists || [],
        ownerships: ownerships || [],
        ownerIds
      };
    },
    enabled: !!userId && !!supabase,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

// Helper to invalidate watchlist cache
export function useInvalidateWatchlists() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['watchlists'] });
} 