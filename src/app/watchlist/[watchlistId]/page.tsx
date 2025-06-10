'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { useSupabaseClient } from '@/utils/auth';
import MovieCard from '@/components/MovieCard';
import YouTubeCard from '@/components/YouTubeCard';
import ImageUploadModal from '@/components/ImageUploadModal';
import SearchBar from '@/components/SearchBar';
import SearchModal from '@/components/SearchModal';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { supabase as clientSupabase } from '@/lib/supabase';
import Rating from '@/components/Rating';
import EditWatchlistModal from '@/components/EditWatchlistModal';

interface Watchlist {
  id: string;
  name: string;
  description: string;
  tags: string[];
  // Add other watchlist properties as needed
}

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: () => void;
}

const MediaPage: React.FC = () => {
  const { watchlistId } = useParams();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabaseClient();

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({});
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState('Custom Order');
  const [customOrder, setCustomOrder] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);

  const fetchSharedUsers = useCallback(async () => {
    if (!watchlist?.id || !supabase) return;
    const { data, error } = await supabase
      .from('watchlist_sharing')
      .select('shared_with_user_id, profiles:shared_with_user_id (id, username)')
      .eq('watchlist_id', watchlist.id);
    if (!error && data) {
      setSharedUsers(data.map((row: any) => row.profiles).filter(Boolean));
    }
  }, [watchlist, supabase]);

  useEffect(() => {
    fetchSharedUsers();
  }, [watchlist, supabase, fetchSharedUsers]);

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
        setWatchlist(wl);

        // Fetch media items
        const { data: mi, error: miError } = await supabase
          .from('media_items')
          .select('*')
          .eq('watchlist_id', watchlistId)
          .order('created_at', { ascending: false });
        if (miError) throw miError;
        const ordered = (mi || []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        setMediaItems(ordered);
        setCustomOrder(ordered);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    if (watchlistId && supabase) fetchData();
  }, [watchlistId, supabase]);

  // Fetch friends for sharing
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.id || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('friends')
          .select(`
            friend_id,
            profiles:friend_id (
              id,
              username
            )
          `)
          .eq('user_id', user.id);
        if (error) {
          console.error('Error fetching friends:', error);
          return;
        }
        setFriends((data || []).map((item: any) => item.profiles).filter(Boolean));
      } catch (err) {
        console.error('Error in fetchFriends:', err);
      }
    };
    fetchFriends();
  }, [user, supabase]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMediaItems(prev => prev.filter(item => item.id !== id));
      setCustomOrder(prev => prev.filter(item => item.id !== id));
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
      setMediaItems(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
    } catch (err: any) {
      console.error('Error updating notes:', err.message);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('media_items')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      setMediaItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      await updateMediaItemCounters(watchlistId as string);
    } catch (err: any) {
      console.error('Error updating status:', err.message);
    }
  };

  const handleRatingChange = async (id: string, rating: number) => {
    try {
      const floatRating = Math.round(Number(rating) * 10) / 10;
      // Optimistically update the UI
      setMediaItems(prev => {
        const updated = prev.map(item => item.id === id ? { ...item, rating: floatRating } : item);
        if (sortOption === 'Rating') {
          return [...updated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        }
        return updated;
      });
      const { error } = await supabase
        .from('media_items')
        .update({ rating: floatRating })
        .eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('Error updating rating:', err.message);
    }
  };

  const setIsOpen = useCallback((id: string, isOpen: boolean) => {
    setOpenCards(prev => ({ ...prev, [id]: isOpen }));
  }, []);

  const onSortEnd = async (result: any) => {
    if (!result.destination) return;
    const reorderedItems = arrayMove(mediaItems, result.source.index, result.destination.index);
    setMediaItems(reorderedItems);
    setCustomOrder(reorderedItems);
    if (sortOption === 'Custom Order') {
      try {
        await Promise.all(reorderedItems.map((item, index) =>
          supabase.from('media_items').update({ order: index }).match({ id: item.id })
        ));
      } catch (error) {
        console.error('Error updating order on backend:', error);
      }
    }
  };

  const handleSortChange = (option: string) => {
    setSortOption(option);
    let sortedMediaItems;
    switch (option) {
      case 'Date Added':
        sortedMediaItems = [...mediaItems].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'Date Modified':
        sortedMediaItems = [...mediaItems].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        break;
      case 'Title':
        sortedMediaItems = [...mediaItems].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Added By':
        sortedMediaItems = [...mediaItems].sort((a, b) => (a.added_by || '').localeCompare(b.added_by || ''));
        break;
      case 'Rating':
        sortedMediaItems = [...mediaItems].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case 'Status':
        const statusOrder = ['to consume', 'consuming', 'consumed'];
        sortedMediaItems = [...mediaItems].sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
        break;
      case 'Medium':
        const mediumOrder = ['Youtube', 'Movie', 'TV Show'];
        sortedMediaItems = [...mediaItems].sort((a, b) => mediumOrder.indexOf(a.medium) - mediumOrder.indexOf(b.medium));
        break;
      case 'Custom Order':
      default:
        sortedMediaItems = [...customOrder];
        break;
    }
    setMediaItems(sortedMediaItems);
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !(sortDropdownRef.current as any).contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Add a client-side version of updateMediaItemCounters
  async function updateMediaItemCounters(watchlistIdParam: string | string[] | undefined) {
    const id = Array.isArray(watchlistIdParam) ? watchlistIdParam[0] : watchlistIdParam;
    if (!id) return;
    const { data: items, error } = await clientSupabase
      .from('media_items')
      .select('status')
      .eq('watchlist_id', id);
    if (error) throw error;
    // Count statuses in JS
    let toConsume = 0, consuming = 0, consumed = 0;
    (items || []).forEach((item: any) => {
      if (item.status === 'to consume') toConsume++;
      else if (item.status === 'consuming') consuming++;
      else if (item.status === 'consumed') consumed++;
    });
    // Update the watchlist with the new counts
    const { error: updateError } = await clientSupabase
      .from('watchlists')
      .update({
        to_consume_count: toConsume,
        consuming_count: consuming,
        consumed_count: consumed
      })
      .eq('id', id);
    if (updateError) throw updateError;
  }

  // When opening the modal, always fetch the latest shared users
  const handleOpenEditModal = () => {
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (newName: string, newDescription: string, newTags: string[], newImage?: string) => {
    try {
      // Update the watchlist in the database
      const { error } = await supabase
        .from('watchlists')
        .update({
          name: newName,
          description: newDescription,
          tags: newTags,
          image: newImage
        })
        .eq('id', watchlistId);

      if (error) throw error;

      // Update local state
      setWatchlist((prev: Watchlist | null) => ({
        ...prev,
        name: newName,
        description: newDescription,
        tags: newTags,
        image: newImage
      }));

      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('Error updating watchlist:', err);
    }
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

  return (
    <div className="container mx-auto top-24 p-4 dark:bg-gray-800 dark:text-white relative w-full">
      <div className="flex justify-between items-start mb-4 w-full">
        <div className="flex items-start space-x-4">
          <div className="relative w-48 h-48 mb-4 group cursor-pointer" onClick={handleOpenEditModal}>
            {watchlist.image ? (
            <img
              src={watchlist.image}
                alt="Watchlist"
                className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
              onError={(e) => {
                  (e.target as HTMLImageElement).src = '/default-watchlist.jpg';
                }}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-white mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-white font-semibold">Edit</span>
            </div>
          </div>
          <div className="flex flex-col justify-start h-48">
            <p className="text-sm text-gray-400 text-left">{watchlist.is_public ? 'Public watchlist' : 'Private watchlist'}</p>
            <h1 className="watchlist-title text-5xl font-bold text-white text-left cursor-pointer" onClick={() => setIsImageUploadModalOpen(true)}>
              {watchlist.name}
            </h1>
            <p className="watchlist-description text-lg text-gray-300 text-left mb-7 flex-grow">
              {watchlist.description}
            </p>
            {/* Add shared users/avatars here if needed */}
            <span className="text-sm text-gray-400">
              {/* Owner, shared users, and media count can be added here if available */}
              {mediaItems.length} media
            </span>
          </div>
        </div>
        <div className="flex justify-end w-full sm:w-48 md:w-60 lg:w-96 xl:w-1/4">
          <SearchBar onSearchClick={() => setIsModalOpen(true)} />
        </div>
      </div>
      <div className="flex justify-end items-center mb-4 w-full" style={{ marginTop: '-65px' }}>
        <div className="relative inline-block text-left" ref={sortDropdownRef}>
          <button
            onClick={toggleDropdown}
            className="ml-4 bg-[#3b3b3b] text-white px-3 py-2 rounded focus:outline-none"
            style={{ width: '160px' }}
          >
            {sortOption}
            <svg
              className={`w-5 h-5 inline ml-2 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
          {isDropdownOpen && (
            <div className="dropdown-menu-sort slide-out-down absolute z-10 ml-4 mt-2 w-full bg-gray-700 text-white text-xl rounded-md shadow-lg"
                 style={{ width: '160px' }}
            >
              <ul className="py-1 text-sm">
                {['Custom Order', 'Rating', 'Status', 'Medium', 'Date Added', 'Date Modified', 'Title', 'Added By'].map((option) => (
                  <li
                    key={option}
                    className="cursor-pointer px-4 py-2 hover:bg-gray-600"
                    onClick={() => handleSortChange(option)}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <DragDropContext onDragEnd={onSortEnd}>
        <Droppable droppableId={`droppable-${watchlistId}`} isDropDisabled={false}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-4">
              {mediaItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(draggableProvided) => (
                    <div
                      ref={draggableProvided.innerRef}
                      {...draggableProvided.draggableProps}
                      className="group flex items-stretch"
                    >
                      <div
                        className="flex items-center pr-2 transition-all duration-200 select-none"
                        style={{ alignSelf: 'stretch', minWidth: '24px', marginLeft: '-24px' }}
                      >
                        <div className="flex flex-col justify-center h-full">
                          <div
                            {...draggableProvided.dragHandleProps}
                            className="grid grid-cols-2 gap-x-[2px] gap-y-[2px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 cursor-grab"
                          >
                            {[0,1,2,3,4,5].map(i => (
                              <span key={i} className="block w-1 h-1 rounded-full bg-[#444]" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 rounded-lg transition-colors duration-200 group-hover:bg-[#262626]">
                        {item.medium === 'YouTube' ? (
                          <YouTubeCard
                            item={item}
                            onDelete={() => handleDelete(item.id)}
                            onNotesChange={handleNotesChange}
                            onStatusChange={handleStatusChange}
                            onRatingChange={handleRatingChange}
                            isOpen={openCards[item.id] || false}
                            setIsOpen={setIsOpen}
                            isDropdownOpen={false}
                            toggleDropdown={() => {}}
                          />
                        ) : (
                          <MovieCard
                            item={item}
                            onDelete={() => handleDelete(item.id)}
                            onNotesChange={handleNotesChange}
                            onStatusChange={handleStatusChange}
                            onRatingChange={handleRatingChange}
                            isOpen={openCards[item.id] || false}
                            setIsOpen={setIsOpen}
                            isDropdownOpen={false}
                            toggleDropdown={() => {}}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {isModalOpen && (
        <SearchModal
          onSelect={async (item: any, type: string) => {
            if (!user) return;
            let newMedia;
            let releaseDate = item.release_date || '';
            if (!releaseDate) releaseDate = null;
            let synopsis = '';
            try {
              if (type === 'youtube') {
                const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
                const imageUrl = item.snippet.thumbnails?.default?.url || '';
                const { data, error } = await supabase.from('media_items').insert([
                  {
                    title: item.snippet.title,
                    medium: 'YouTube',
                    watchlist_id: watchlistId,
                    image: imageUrl,
                    url: videoUrl,
                    release_date: item.snippet.publishedAt?.substring(0, 10) || null,
                    creator: item.snippet.channelTitle,
                    synopsis: '',
                    added_by: user.username || 'Guest',
                    status: 'to consume',
                    order: mediaItems.length,
                  },
                ]).select();
                if (error) throw error;
                setMediaItems([...mediaItems, ...data]);
                setCustomOrder([...mediaItems, ...data]);
                await updateMediaItemCounters(watchlistId as string);
              } else {
                // Movies or TV shows
                const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
                const detailsUrl = `https://api.themoviedb.org/3/${type === 'movies' ? 'movie' : 'tv'}/${item.id}?api_key=${apiKey}`;
                const response = await fetch(detailsUrl);
                const data = await response.json();
                synopsis = data.overview || '';
                const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
                const { data: inserted, error } = await supabase.from('media_items').insert([
                  {
                    title: item.title || item.name,
                    medium: type === 'movies' ? 'Movie' : 'TV Show',
                    watchlist_id: watchlistId,
                    image: imageUrl,
                    release_date: releaseDate,
                    creator: data.created_by && data.created_by.length > 0 ? data.created_by[0].name : (item.director || ''),
                    synopsis,
                    added_by: user.username || 'Guest',
                    status: 'to consume',
                    order: mediaItems.length,
                  },
                ]).select();
                if (error) throw error;
                setMediaItems([...mediaItems, ...inserted]);
                setCustomOrder([...mediaItems, ...inserted]);
                await updateMediaItemCounters(watchlistId as string);
              }
              setIsModalOpen(false);
            } catch (err: any) {
              console.error('Failed to add item:', err.message);
            }
          }}
          onClose={() => setIsModalOpen(false)}
          inputRef={inputRef}
        />
      )}
      {isImageUploadModalOpen && (
        <ImageUploadModal
          watchlistId={watchlistId as string}
          onClose={() => setIsImageUploadModalOpen(false)}
          sharedUsers={sharedUsers}
          friends={friends}
          onImageUpload={(imageUrl) => {
            setImageUrl(imageUrl);
            setIsImageUploadModalOpen(false);
          }}
          watchlistName={watchlist?.name || ''}
          watchlistDescription={watchlist?.description || ''}
          watchlistImage={watchlist?.image || ''}
        />
      )}
      {isEditModalOpen && (
        <EditWatchlistModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          currentName={watchlist?.name || ''}
          currentDescription={watchlist?.description || ''}
          currentTags={watchlist?.tags || []}
          watchlistId={watchlistId as string}
          currentImage={watchlist?.image || ''}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default MediaPage;