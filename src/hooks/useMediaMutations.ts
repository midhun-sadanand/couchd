import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient } from '@/utils/auth';

interface MediaItem {
  id: string;
  title: string;
  notes?: string;
  rating?: number;
  status?: string;
  [key: string]: any;
}

// Update media item notes
export function useUpdateMediaNotes() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      const { data, error } = await supabase
        .from('media_items')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async ({ itemId, notes }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['mediaItems'] });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['mediaItems'] });

      // Optimistically update all mediaItems queries
      queryClient.setQueriesData({ queryKey: ['mediaItems'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item: MediaItem) =>
            item.id === itemId ? { ...item, notes } : item
          );
        }
        return old;
      });

      return { previousData };
    },
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    },
  });
}

// Update media item rating
export function useUpdateMediaRating() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, rating }: { itemId: string; rating: number }) => {
      const { data, error } = await supabase
        .from('media_items')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async ({ itemId, rating }) => {
      await queryClient.cancelQueries({ queryKey: ['mediaItems'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['mediaItems'] });

      queryClient.setQueriesData({ queryKey: ['mediaItems'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item: MediaItem) =>
            item.id === itemId ? { ...item, rating } : item
          );
        }
        return old;
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    },
  });
}

// Update media item status
export function useUpdateMediaStatus() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const { data, error } = await supabase
        .from('media_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async ({ itemId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['mediaItems'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['mediaItems'] });

      queryClient.setQueriesData({ queryKey: ['mediaItems'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item: MediaItem) =>
            item.id === itemId ? { ...item, status } : item
          );
        }
        return old;
      });

      // Also update watchlist counts
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
      queryClient.invalidateQueries({ queryKey: ['watchlists'] });
    },
  });
}

// Combined update for notes and rating (used in MediaFeed)
export function useUpdateMedia() {
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, notes, rating }: { itemId: string; notes?: string; rating?: number }) => {
      const updates: any = { updated_at: new Date().toISOString() };
      if (notes !== undefined) updates.notes = notes;
      if (rating !== undefined) updates.rating = rating;

      const { data, error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Optimistic update
    onMutate: async ({ itemId, notes, rating }) => {
      await queryClient.cancelQueries({ queryKey: ['mediaItems'] });

      const previousData = queryClient.getQueriesData({ queryKey: ['mediaItems'] });

      queryClient.setQueriesData({ queryKey: ['mediaItems'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item: MediaItem) => {
            if (item.id === itemId) {
              const updates: any = { ...item };
              if (notes !== undefined) updates.notes = notes;
              if (rating !== undefined) updates.rating = rating;
              return updates;
            }
            return item;
          });
        }
        return old;
      });

      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

