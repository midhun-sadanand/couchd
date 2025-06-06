import { useState, useEffect } from 'react';
import { useSupabase } from '@/utils/auth';
import { useUser } from '@/utils/auth';

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
  const [data, setData] = useState<WatchlistData>({ watchlists: [], ownerships: [], ownerIds: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  useEffect(() => {
    if (!userId || supabaseLoading || !supabase) {
      setIsLoading(true);
      return;
    }

    const fetchWatchlists = async () => {
      try {
        setIsLoading(true);
        // Fetch watchlists using the Supabase user ID
        const { data: watchlists, error: watchlistsError } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (watchlistsError) {
          console.error('Error fetching watchlists:', watchlistsError);
          throw watchlistsError;
        }

        // Fetch watchlist ownerships only if there are valid watchlist IDs
        let ownerships: WatchlistOwnership[] = [];
        if (watchlists && watchlists.length > 0) {
          const validWatchlistIds = watchlists.map((w: Watchlist) => w.id).filter(Boolean);
          if (validWatchlistIds.length > 0) {
            const result = await supabase
              .from('watchlist_ownership')
              .select('user_id, watchlist_id')
              .in('watchlist_id', validWatchlistIds);
            if (result.error) {
              console.error('Error fetching watchlist ownerships:', result.error);
              throw result.error;
            }
            ownerships = result.data || [];
          }
        }

        const ownerIds = [...new Set(ownerships.map((o: WatchlistOwnership) => o.user_id))];

        setData({
          watchlists: watchlists || [],
          ownerships: ownerships || [],
          ownerIds
        });
      } catch (err) {
        console.error('Error in fetchWatchlists:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch watchlists'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlists();
  }, [userId, supabase, supabaseLoading]);

  return { data, isLoading, error };
}

// If using React Query, you can clear all watchlist-related queries like this:
// import { useQueryClient } from '@tanstack/react-query';
// const queryClient = useQueryClient();
// queryClient.invalidateQueries(['watchlists']);
// queryClient.clear(); 