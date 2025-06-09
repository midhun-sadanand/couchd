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
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { arrayMoveImmutable as arrayMove } from 'array-move';

const MediaPage: React.FC = () => {
  const { watchlistId } = useParams();
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabaseClient();

  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [sortOption, setSortOption] = useState('Custom Order');
  const [customOrder, setCustomOrder] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

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
        setMediaItems(mi || []);
        setCustomOrder(mi || []);
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
      setMediaItems(prev => prev.map(item => item.id === id ? { ...item, rating } : item));
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
    try {
      await Promise.all(reorderedItems.map((item, index) =>
        supabase.from('media_items').update({ order: index }).match({ id: item.id })
      ));
    } catch (error) {
      console.error('Error updating order on backend:', error);
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
      case 'Status':
        const statusOrder = ['consuming', 'to consume', 'consumed'];
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
          <div className="relative w-48 h-48 mb-4">
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
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100">
              <button
                onClick={() => setIsImageUploadModalOpen(true)}
                className="text-white flex flex-col items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mb-1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span>Edit watchlist</span>
              </button>
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
                {['Custom Order', 'Status', 'Medium', 'Date Added', 'Date Modified', 'Title', 'Added By'].map((option) => (
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
        <Droppable droppableId={`droppable-${watchlistId}`}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {mediaItems.map((item, index) => (
                item.medium === 'YouTube' ? (
                  <YouTubeCard
                    key={item.id}
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
                    key={item.id}
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
                )
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      {isModalOpen && (
        <SearchModal
          isOpen={isModalOpen}
          onSelect={() => {}}
          onClose={() => setIsModalOpen(false)}
          medium={watchlist?.medium || 'movies'}
          inputRef={inputRef}
        />
      )}
      {isImageUploadModalOpen && (
        <ImageUploadModal
          isOpen={isImageUploadModalOpen}
          onClose={() => setIsImageUploadModalOpen(false)}
          onUpload={() => {}}
        />
      )}
    </div>
  );
};

export default MediaPage;