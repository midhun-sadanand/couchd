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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 15 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

export default useRecentActivity;
