'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { useSupabaseClient } from '@/utils/auth';
import MovieCard from '@/components/MovieCard';
import YouTubeCard from '@/components/YouTubeCard';
import { MediaItem, StatusType } from '@/types';
import ImageUploadModal from '@/components/ImageUploadModal';

const MediaPage: React.FC = () => {
  const { watchlistId } = useParams();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabaseClient();

  const [watchlist, setWatchlist] = useState<any>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);

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

        // Fetch image from Supabase Storage if exists
        if (wl.image) {
          const imagePath = String(wl.image);
          const { data: publicUrlData } = supabase.storage
            .from('images')
            .getPublicUrl(imagePath);
          setImageUrl(publicUrlData?.publicUrl || null);
        } else {
          setImageUrl(null);
        }

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

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setMediaItems(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error('Error deleting media item:', err.message);
    }
  };

  const handleNotesChange = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({ notes })
        .eq('id', id);
      
      if (error) throw error;
      
      setMediaItems(prev => prev.map(item => 
        item.id === id ? { ...item, notes } : item
      ));
    } catch (err: any) {
      console.error('Error updating notes:', err.message);
    }
  };

  const handleStatusChange = async (id: string, status: StatusType) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      
      setMediaItems(prev => prev.map(item => 
        item.id === id ? { ...item, status } : item
      ));
    } catch (err: any) {
      console.error('Error updating status:', err.message);
    }
  };

  const handleRatingChange = async (id: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({ rating })
        .eq('id', id);
      
      if (error) throw error;
      
      setMediaItems(prev => prev.map(item => 
        item.id === id ? { ...item, rating } : item
      ));
    } catch (err: any) {
      console.error('Error updating rating:', err.message);
    }
  };

  const handleToggleOpen = (id: string, isOpen: boolean) => {
    setOpenCards(prev => ({ ...prev, [id]: isOpen }));
  };

  const handleToggleDropdown = (id: string) => {
    setDropdownOpen(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleImageUpload = (newImageUrl: string) => {
    setImageUrl(newImageUrl);
    setImageUploadModalOpen(false);
  };

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

  // Before the return statement, log the imageUrl for debugging
  if (imageUrl) {
    console.log('Watchlist image URL:', imageUrl);
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#232323] p-4">
      <div className="w-full max-w-3xl">
        {imageUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={watchlist.image}
              alt={watchlist?.name || 'Watchlist'}
              className="w-48 h-48 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/default-watchlist.jpg';
              }}
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-[#e6e6e6] mb-2">{watchlist.name}</h1>
        <p className="text-lg text-gray-400 mb-4">{watchlist.description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {(watchlist.tags || []).map((tag: string, idx: number) => (
            <span key={idx} className="bg-[#3b3b3b] text-gray-300 px-2 py-1 rounded-full text-sm">{tag}</span>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {mediaItems.length > 0 ? (
            mediaItems.map((item: MediaItem) => {
              const commonProps = {
                item,
                onDelete: () => handleDelete(item.id),
                onNotesChange: handleNotesChange,
                onStatusChange: handleStatusChange,
                onRatingChange: handleRatingChange,
                isOpen: openCards[item.id] || false,
                setIsOpen: handleToggleOpen,
                isDropdownOpen: dropdownOpen[item.id] || false,
                toggleDropdown: () => handleToggleDropdown(item.id),
              };

              return item.medium === 'YouTube' ? (
                <YouTubeCard key={item.id} {...commonProps} />
              ) : (
                <MovieCard key={item.id} {...commonProps} />
              );
            })
          ) : (
            <div className="col-span-full text-gray-400">No media items in this watchlist yet.</div>
          )}
        </div>
        <button
          onClick={() => setImageUploadModalOpen(true)}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded"
        >
          Edit Watchlist
        </button>
      </div>
      {imageUploadModalOpen && (
        <ImageUploadModal
          watchlistId={watchlistId}
          onClose={() => setImageUploadModalOpen(false)}
          watchlistName={watchlist.name}
          watchlistDescription={watchlist.description}
          watchlistImage={watchlist.image}
          onImageUpload={handleImageUpload}
        />
      )}
    </div>
  );
};

export default MediaPage;