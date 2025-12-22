import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '../utils/auth';

interface User {
  id: string;
  username: string;
}

export function useSharedUsers(watchlistId: string) {
  const supabase = useSupabaseClient();

  return useQuery<User[], Error>({
    queryKey: ['sharedUsers', watchlistId],
    queryFn: async () => {
      if (!watchlistId || !supabase || typeof watchlistId !== 'string' || watchlistId.trim() === '') {
        return [];
      }

      // Fetch ownerships
      const { data: ownerships, error: ownershipError } = await supabase
        .from('watchlist_ownership')
        .select('user_id')
        .eq('watchlist_id', watchlistId);

      if (ownershipError) throw ownershipError;

      if (!ownerships || ownerships.length === 0) return [];

      // Fetch user profiles
      const userIds = ownerships.map(o => o.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: !!watchlistId && !!supabase,
    staleTime: 60 * 60 * 1000, // 60 minutes (1 hour) - shared users change infrequently
    gcTime: 4 * 60 * 60 * 1000, // 4 hours - longer cache retention
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Disable refetch on focus
    refetchOnReconnect: false, // Disable refetch on reconnect
  });
}

// Helper to invalidate shared users cache
export function useInvalidateSharedUsers() {
  const queryClient = useQueryClient();
  return (watchlistId?: string) => {
    if (watchlistId) {
      queryClient.invalidateQueries({ queryKey: ['sharedUsers', watchlistId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['sharedUsers'] });
    }
  };
} 