import { useState, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useSupabaseClient } from '../utils/auth';

interface MediaItem {
  id: string;
  title: string;
  type: string;
  status: string;
  rating?: number;
  notes?: string;
  progress?: number;
  totalEpisodes?: number;
  posterUrl?: string;
  addedAt: Date;
  updatedAt: Date;
}

interface Watchlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface WatchlistData {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  items: MediaItem[];
  ownerId: string;
}

interface WatchlistDataState {
  data: WatchlistData | null;
  isLoading: boolean;
  error: Error | null;
  addItem: (item: Omit<MediaItem, 'id' | 'addedAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<MediaItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  isOwner: boolean;
}

export function useWatchlistData(watchlistId: string) {
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user || !watchlistId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('watchlists')
          .select('*')
          .eq('id', watchlistId)
          .single();

        if (error) throw error;
        setWatchlist(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch watchlist'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, watchlistId, supabase]);

  return { watchlist, isLoading, error };
}

export function useWatchlistDataState(watchlistId: string, userId?: string): WatchlistDataState {
  const { data, isLoading, error } = useWatchlistData(watchlistId);

  const addItemMutation = useMutation({
    mutationFn: async (item: Omit<MediaItem, 'id' | 'addedAt' | 'updatedAt'>) => {
      if (!userId) throw new Error('User not authenticated');

      const user = await db.user.findUnique({
        where: { userId: userId }
      });

      if (!user) throw new Error('User not found');

      const watchlist = await db.watchlist.findUnique({
        where: { id: watchlistId },
        select: { ownerId: true }
      });

      if (!watchlist) throw new Error('Watchlist not found');
      if (watchlist.ownerId !== user.id) throw new Error('Unauthorized');

      return db.mediaItem.create({
        data: {
          ...item,
          watchlist: { connect: { id: watchlistId } }
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist', watchlistId]);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MediaItem> }) => {
      if (!userId) throw new Error('User not authenticated');

      const user = await db.user.findUnique({
        where: { userId: userId }
      });

      if (!user) throw new Error('User not found');

      const watchlist = await db.watchlist.findUnique({
        where: { id: watchlistId },
        select: { ownerId: true }
      });

      if (!watchlist) throw new Error('Watchlist not found');
      if (watchlist.ownerId !== user.id) throw new Error('Unauthorized');

      return db.mediaItem.update({
        where: { id },
        data: updates
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist', watchlistId]);
    }
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');

      const user = await db.user.findUnique({
        where: { userId: userId }
      });

      if (!user) throw new Error('User not found');

      const watchlist = await db.watchlist.findUnique({
        where: { id: watchlistId },
        select: { ownerId: true }
      });

      if (!watchlist) throw new Error('Watchlist not found');
      if (watchlist.ownerId !== user.id) throw new Error('Unauthorized');

      return db.mediaItem.delete({
        where: { id }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['watchlist', watchlistId]);
    }
  });

  return {
    data: data || null,
    isLoading,
    error: error as Error | null,
    addItem: async (item) => {
      await addItemMutation.mutateAsync(item);
    },
    updateItem: async (id, updates) => {
      await updateItemMutation.mutateAsync({ id, updates });
    },
    removeItem: async (id) => {
      await removeItemMutation.mutateAsync(id);
    },
    isOwner: data?.ownerId === userId
  };
} 