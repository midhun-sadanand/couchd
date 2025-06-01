import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../utils/auth';

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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  useEffect(() => {
    if (supabaseLoading || !supabase) {
      setIsLoading(true);
      return;
    }
    const fetchMediaItems = async () => {
      if (!user || !watchlistId) return;
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('media_items')
          .select('*')
          .eq('watchlist_id', watchlistId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setMediaItems(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch media items'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchMediaItems();
  }, [user, watchlistId, supabase, supabaseLoading]);

  return { mediaItems, isLoading: isLoading || supabaseLoading, error };
} 