import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../utils/auth';

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export function useWatchlists() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  useEffect(() => {
    if (supabaseLoading || !supabase) {
      setIsLoading(true);
      return;
    }
    const fetchWatchlists = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setWatchlists(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch watchlists'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchWatchlists();
  }, [user, supabase, supabaseLoading]);

  return { watchlists, isLoading: isLoading || supabaseLoading, error };
} 