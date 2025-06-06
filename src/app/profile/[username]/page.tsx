"use client";

import { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@/utils/auth';

export default function ProfilePage() {
  const { user, loading } = useUser();
  const supabase = useSupabaseClient();

  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user || !supabase) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch watchlists
      const { data: watchlistsData } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', user.id);

      // Fetch friends
      const { data: friendsData } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id);

      // Fetch media items (all items in user's watchlists)
      const watchlistIds = (watchlistsData || []).map((wl: any) => wl.id);
      let mediaItemsData: any[] = [];
      if (watchlistIds.length > 0) {
        const { data } = await supabase
          .from('media_items')
          .select('*')
          .in('watchlist_id', watchlistIds);
        mediaItemsData = data || [];
      }

      setWatchlists(watchlistsData || []);
      setFriends(friendsData || []);
      setMediaItems(mediaItemsData);
      setIsLoading(false);
    };

    fetchData();
  }, [user, supabase]);

  if (loading || isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{user.email}'s Profile</h1>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Watchlists</h2>
        <ul className="list-disc ml-6">
          {watchlists.map((wl: any) => (
            <li key={wl.id}>{wl.name}</li>
          ))}
        </ul>
      </div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Friends</h2>
        <ul className="list-disc ml-6">
          {friends.map((f: any) => (
            <li key={f.friend_id}>{f.friend_id}</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-2xl font-semibold mb-2">Media Items</h2>
        <ul className="list-disc ml-6">
          {mediaItems.map((mi: any) => (
            <li key={mi.id}>{mi.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
} 