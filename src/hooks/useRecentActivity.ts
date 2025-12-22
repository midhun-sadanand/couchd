import { useQuery } from '@tanstack/react-query';
import { useSupabaseClient } from '../utils/auth';

interface Activity {
  id: string;
  title: string;
  status: string;
  created_at: string;
  added_by: string;
  watchlist_id: string;
  watchlists?: {
    name: string;
  };
}

export function useRecentActivity(userId: string | undefined, limit: number = 10) {
  const supabase = useSupabaseClient();

  return useQuery<Activity[], Error>({
    queryKey: ['recentActivity', userId, limit],
    queryFn: async () => {
      if (!userId || !supabase) return [];

      const { data, error } = await supabase
        .from('media_items')
        .select('id, title, status, created_at, added_by, watchlist_id, watchlists(name)')
        .eq('added_by', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && !!supabase,
    staleTime: 30 * 60 * 1000, // 30 minutes - recent activity can be slightly stale
    gcTime: 2 * 60 * 60 * 1000, // 2 hours cache retention
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Disable refetch on focus
    refetchOnReconnect: false, // Disable refetch on reconnect
  });
}

export default useRecentActivity;
