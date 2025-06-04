import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../utils/auth';

interface User {
  id: string;
  username: string;
}

export function useSharedUsers(watchlistId: string) {
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  useEffect(() => {
    if (supabaseLoading || !supabase) {
      setIsLoading(true);
      return;
    }
    const fetchSharedUsers = async () => {
      if (!user || !watchlistId) return;
      if (typeof watchlistId !== 'string' || watchlistId.trim() === '') return;
      try {
        setIsLoading(true);
        const { data: ownerships, error: ownershipError } = await supabase
          .from('watchlist_ownership')
          .select('user_id')
          .eq('watchlist_id', watchlistId);

        if (ownershipError) throw ownershipError;

        if (ownerships && ownerships.length > 0) {
          const userIds = ownerships.map(o => o.user_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds);

          if (profilesError) throw profilesError;
          setSharedUsers(profiles || []);
        } else {
          setSharedUsers([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch shared users'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchSharedUsers();
  }, [user, watchlistId, supabase, supabaseLoading]);

  return { sharedUsers, isLoading: isLoading || supabaseLoading, error };
} 