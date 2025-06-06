'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { useWatchlistData } from '@/hooks/useWatchlistData';
import { useMediaItems } from '@/hooks/useMediaItems';
import MovieCard from '@/components/MovieCard';
import YouTubeCard from '@/components/YouTubeCard';

const WatchlistDetailPage: React.FC = () => {
  const { watchlistId } = useParams();
  const { user, isLoaded } = useUser();

  // Fetch the watchlist and its media items
  const { watchlist, isLoading: isWatchlistLoading, error: watchlistError } = useWatchlistData(watchlistId as string);
  const { mediaItems, isLoading: isMediaLoading, error: mediaError } = useMediaItems(watchlistId as string);

  // Loading state
  if (!isLoaded || isWatchlistLoading || isMediaLoading) {
    return <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">Loading...</div>;
  }

  // Error state
  if (watchlistError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error loading watchlist: {watchlistError.message}
      </div>
    );
  }
  if (mediaError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error loading media items: {mediaError.message}
      </div>
    );
  }

  // No user (should not redirect, just show a message)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">
        You must be logged in to view this watchlist.
      </div>
    );
  }

  // No watchlist found
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
          {mediaItems && mediaItems.length > 0 ? (
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

export default WatchlistDetailPage;