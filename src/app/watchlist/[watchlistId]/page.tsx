'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { useSupabaseClient } from '@/utils/auth';
import MovieCard from '@/components/MovieCard';
import YouTubeCard from '@/components/YouTubeCard';

const MediaPage: React.FC = () => {
  const { watchlistId } = useParams();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabaseClient();

  const [watchlist, setWatchlist] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the watchlist
        const { data: wl, error: wlError } = await supabase
          .from('watchlists')
          .select('*')
          .eq('id', watchlistId)
          .single();
        if (wlError) throw wlError;

        // Parse tags if needed
        let tags: string[] = [];
        if (wl.tags) {
          try {
            tags = Array.isArray(wl.tags)
              ? wl.tags
              : JSON.parse(wl.tags);
          } catch {
            tags = wl.tags.split(',').map((t: string) => t.trim());
          }
        }

        setWatchlist({ ...wl, tags });

        // Fetch media items
        const { data: mi, error: miError } = await supabase
          .from('media_items')
          .select('*')
          .eq('watchlist_id', watchlistId)
          .order('created_at', { ascending: false });
        if (miError) throw miError;

        setMediaItems(mi || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (watchlistId && supabase) fetchData();
  }, [watchlistId, supabase]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#e6e6e6]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#e6e6e6] mb-4"></div>
        <span>Loading watchlist...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">
        You must be logged in to view this watchlist.
      </div>
    );
  }

  if (!watchlist) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">
        Watchlist not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#232323] p-4">
      <div className="w-full max-w-3xl">
        <h1 className="text-4xl font-bold text-[#e6e6e6] mb-2">{watchlist.name}</h1>
        <p className="text-lg text-gray-400 mb-4">{watchlist.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(watchlist.tags || []).map((tag: string, idx: number) => (
            <span key={idx} className="bg-[#3b3b3b] text-gray-300 px-2 py-1 rounded-full text-sm">{tag}</span>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {mediaItems.length > 0 ? (
            mediaItems.map((item: any) =>
              item.medium === 'YouTube' ? (
                <YouTubeCard key={item.id} {...item} />
              ) : (
                <MovieCard key={item.id} {...item} />
              )
            )
          ) : (
            <div className="col-span-full text-gray-400">No media items in this watchlist yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPage;