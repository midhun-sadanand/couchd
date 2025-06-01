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
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('shared_users')
          .select('id, username')
          .eq('watchlist_id', watchlistId);
        if (error) throw error;
        setSharedUsers(data || []);
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