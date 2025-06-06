"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { CSSTransition } from 'react-transition-group';

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

interface WatchlistData {
  id: string;
  is_public: boolean;
  image?: string;
  description?: string;
  shared_with: string[];
}

export default function MediaPage() {
  const params = useParams();
  const watchlistId = params.id as string;

  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [watchlistPublic, setWatchlistPublic] = useState(false);
  const [watchlistImage, setWatchlistImage] = useState('');
  const [watchlistDescription, setWatchlistDescription] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<Record<string, boolean>>({});
  const [friends, setFriends] = useState([]);
  const [sortOption, setSortOption] = useState('Custom Order');
  const [customOrder, setCustomOrder] = useState<MediaItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const { data: mediaItemsData, error: mediaItemsError } = useMediaItems(watchlistId);
  const { data: watchlistData, error: watchlistDataError } = useWatchlistData(watchlistId);

  // Fetch shared users data
  const sharedUserIds = watchlistData?.shared_with || [];
  const { data: sharedUsersData, error: sharedUsersError } = useSharedUsers(sharedUserIds);

  useEffect(() => {
    if (mediaItemsData) {
      setMediaItems(mediaItemsData);
      setCustomOrder(mediaItemsData);
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
      await Promise.all(reorderedItems.map((item, index) =>
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
          <div className="mt-4">
            <img
              src={watchlistImage}
              alt="Watchlist cover"
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = '/default-watchlist.jpg';
              }}
            />
          </div>
        )}
        
        {watchlistDescription && (
          <p className="mt-4 text-gray-600">{watchlistDescription}</p>
        )}
      </div>

      <DragDropContext onDragEnd={onSortEnd}>
        <Droppable droppableId={`droppable-${watchlistId}`}>
          {(provided) => (
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
                          {...item}
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
                          {...item}
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
          onClose={() => setIsModalOpen(false)}
          watchlistId={watchlistId}
          onItemAdded={(newItem) => {
            setMediaItems(prev => [...prev, newItem]);
            setCustomOrder(prev => [...prev, newItem]);
          }}
        />
      )}

      {isImageUploadModalOpen && (
        <ImageUploadModal
          onClose={() => setIsImageUploadModalOpen(false)}
          watchlistId={watchlistId}
          currentImage={watchlistImage}
          currentDescription={watchlistDescription}
          isPublic={watchlistPublic}
          sharedUsers={sharedUsers}
          onUpdate={(updates) => {
            setWatchlistImage(updates.image || '');
            setWatchlistDescription(updates.description || '');
            setWatchlistPublic(updates.isPublic);
            setSharedUsers(updates.sharedUsers);
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