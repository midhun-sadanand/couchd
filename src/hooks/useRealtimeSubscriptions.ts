import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseClient, useUser } from '@/utils/auth';

// Realtime subscription for friend requests
export function useFriendRequestsRealtime() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase || !user) return;

    // Subscribe to friend requests table changes
    const channel = supabase
      .channel('friend-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Friend request change detected:', payload);
          
          // Invalidate friend requests cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
          queryClient.invalidateQueries({ queryKey: ['friendsProfiles'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, queryClient]);
}

// Realtime subscription for watchlist shares
export function useWatchlistSharesRealtime() {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!supabase || !user) return;

    // Subscribe to watchlist ownership changes (when someone shares with you)
    const channel = supabase
      .channel('watchlist-ownership-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watchlist_ownership',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New watchlist shared with you:', payload);
          
          // Invalidate watchlists cache
          queryClient.invalidateQueries({ queryKey: ['watchlists'] });
          queryClient.invalidateQueries({ queryKey: ['sharedUsers'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, queryClient]);
}

// Combined realtime hook - use in main layout
export function useRealtimeUpdates() {
  useFriendRequestsRealtime();
  useWatchlistSharesRealtime();
}

