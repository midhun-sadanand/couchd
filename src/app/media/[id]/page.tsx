"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { CSSTransition } from 'react-transition-group';
import { arrayMove } from '@dnd-kit/sortable';

import MovieCard from '@/components/MovieCard';
import YouTubeCard from '@/components/YouTubeCard';
import SearchBar from '@/components/SearchBar';
import SearchModal from '@/components/SearchModal';
import ImageUploadModal from '@/components/ImageUploadModal';
import { useMediaItems } from '@/hooks/useMediaItems';
import { useWatchlistData } from '@/hooks/useWatchlistData';
import { useCachedProfileData } from '@/hooks/useCachedProfileData';
import { useSharedUsers } from '@/hooks/useSharedUsers';

interface MediaItem {
  id: string;
  title: string;
  medium: string;
  length?: string;
  release_date?: string;
  created_at: string;
  synopsis?: string;
  image?: string;
  url?: string;
  creator?: string;
  status: string;
  notes?: string;
  rating?: number;
  added_by?: string;
  order: number;
}

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  image?: string;
  is_public: boolean;
  shared_with: string[];
}

interface User {
  id: string;
  username: string;
}

interface CachedProfileData {
  friends: User[];
}

export default function MediaPage() {
  const router = useRouter();
  const params = useParams();
  const watchlistId = params.id as string;

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [watchlistPublic, setWatchlistPublic] = useState(false);
  const [watchlistImage, setWatchlistImage] = useState('');
  const [watchlistDescription, setWatchlistDescription] = useState('');
  const [sharedUsers, setSharedUsers] = useState<any[]>([]);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<Record<string, boolean>>({});
  const [friends, setFriends] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState('Custom Order');
  const [customOrder, setCustomOrder] = useState<MediaItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const { mediaItems: mediaItemsData, error: mediaItemsError } = useMediaItems(watchlistId);
  const { watchlist: watchlistData, error: watchlistDataError } = useWatchlistData(watchlistId);

  // Fetch shared users data
  const sharedUserIds = watchlistData?.shared_with || [];
  const { sharedUsers: sharedUsersData, error: sharedUsersError } = useSharedUsers(sharedUserIds);

  const { friends: friendsProfiles } = useCachedProfileData();

  useEffect(() => {
    if (mediaItemsData) {
      setMediaItems(mediaItemsData as MediaItem[]);
      setCustomOrder(mediaItemsData as MediaItem[]);
    }
  }, [mediaItemsData]);

  useEffect(() => {
    if (watchlistData) {
      setWatchlistPublic(watchlistData.is_public);
      setWatchlistImage(watchlistData.image || '');
      setWatchlistDescription(watchlistData.description || '');
    }
  }, [watchlistData]);

  useEffect(() => {
    if (sharedUsersData) {
      setSharedUsers(sharedUsersData);
    }
  }, [sharedUsersData]);

  useEffect(() => {
    if (friendsProfiles) {
      setFriends(friendsProfiles);
    }
  }, [friendsProfiles]);

  const handleNotesChange = async (id: string, notes: string) => {
    try {
      const response = await fetch('/api/media-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes })
      });
      
      if (!response.ok) throw new Error('Failed to update notes');
      
      setMediaItems(currentItems => 
        currentItems.map(item => item.id === id ? { ...item, notes } : item)
      );
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/media-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update status');
      
      setMediaItems(currentItems => 
        currentItems.map(item => item.id === id ? { ...item, status: newStatus } : item)
      );
      setIsStatusDropdownOpen(prevState => ({ ...prevState, [id]: false }));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const toggleStatusDropdown = (id: string) => {
    setIsStatusDropdownOpen(prevState => ({ ...prevState, [id]: !prevState[id] }));
  };

  const setIsOpen = useCallback((id: string, isOpen: boolean) => {
    setOpenCards(prevOpenCards => ({ ...prevOpenCards, [id]: isOpen }));
  }, []);

  const handleRatingChange = async (id: string, rating: number) => {
    try {
      const response = await fetch('/api/media-items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, rating })
      });
      
      if (!response.ok) throw new Error('Failed to update rating');
      
      setMediaItems(currentItems => 
        currentItems.map(item => item.id === id ? { ...item, rating } : item)
      );
    } catch (error) {
      console.error('Error updating rating:', error);
    }
  };

  const onSortEnd = async (result: any) => {
    if (!result.destination) return;

    const reorderedItems = arrayMove(mediaItems, result.source.index, result.destination.index);
    setMediaItems(reorderedItems);
    setCustomOrder(reorderedItems);

    try {
      await Promise.all(reorderedItems.map((item: MediaItem, index: number) =>
        fetch('/api/media-items', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, order: index })
        })
      ));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDeleteMediaItem = async (deletedId: string, medium: string) => {
    try {
      const response = await fetch('/api/media-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deletedId })
      });
      
      if (!response.ok) throw new Error('Failed to delete item');
      
      setMediaItems(currentItems => currentItems.filter(item => item.id !== deletedId));
      setCustomOrder(currentOrder => currentOrder.filter(item => item.id !== deletedId));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/watchlists')}
        className="mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Back to Watchlists
      </button>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Item
            </button>
            <button
              onClick={() => setIsImageUploadModalOpen(true)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Edit Watchlist
            </button>
          </div>
        </div>
        
        {watchlistImage && (
          <div className="mt-4 relative group cursor-pointer" onClick={() => setIsImageUploadModalOpen(true)}>
            <img
              src={watchlistImage}
              alt="Watchlist cover"
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/default-watchlist.jpg';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-10 h-10 text-white mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span className="text-white font-semibold">Edit</span>
            </div>
          </div>
        )}
        
        {watchlistDescription && (
          <p className="mt-4 text-gray-600">{watchlistDescription}</p>
        )}
      </div>

      <DragDropContext onDragEnd={onSortEnd}>
        <Droppable droppableId={`droppable-${watchlistId}`}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
            >
              {mediaItems.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {item.medium === 'YouTube' ? (
                        <YouTubeCard
                          item={item}
                          onDelete={() => handleDeleteMediaItem(item.id, item.medium)}
                          onNotesChange={handleNotesChange}
                          onStatusChange={handleStatusChange}
                          onRatingChange={handleRatingChange}
                          isOpen={openCards[item.id] || false}
                          setIsOpen={setIsOpen}
                          isDropdownOpen={isStatusDropdownOpen[item.id] || false}
                          toggleDropdown={() => toggleStatusDropdown(item.id)}
                        />
                      ) : (
                        <MovieCard
                          item={item}
                          onDelete={() => handleDeleteMediaItem(item.id, item.medium)}
                          onNotesChange={handleNotesChange}
                          onStatusChange={handleStatusChange}
                          onRatingChange={handleRatingChange}
                          isOpen={openCards[item.id] || false}
                          setIsOpen={setIsOpen}
                          isDropdownOpen={isStatusDropdownOpen[item.id] || false}
                          toggleDropdown={() => toggleStatusDropdown(item.id)}
                        />
                      )}
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
          isOpen={isModalOpen}
          onSelect={() => {}}
          onClose={() => setIsModalOpen(false)}
          // Add other required props as needed
        />
      )}

      {isImageUploadModalOpen && (
        <ImageUploadModal
          onClose={() => setIsImageUploadModalOpen(false)}
          watchlistId={watchlistId}
          watchlistName={watchlistData?.name || ''}
          watchlistDescription={watchlistDescription}
          watchlistImage={watchlistImage}
          sharedUsers={sharedUsers}
          friends={friends}
          onImageUpload={(imageUrl) => {
            setWatchlistImage(imageUrl);
            setIsImageUploadModalOpen(false);
          }}
        />
      )}

      <CSSTransition
        in={showSuccessMessage}
        timeout={300}
        classNames="fade"
        unmountOnExit
      >
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded shadow-lg">
          {successMessage}
        </div>
      </CSSTransition>
    </div>
  );
} 