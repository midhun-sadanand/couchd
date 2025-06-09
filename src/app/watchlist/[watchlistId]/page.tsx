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

function EditWatchlistModal({ watchlist, onClose, onSave, friends, sharedUsers, refreshWatchlist }: { watchlist: any, onClose: () => void, onSave: (updates: any) => void, friends: any[], sharedUsers: any[], refreshWatchlist: () => void }) {
  const supabase = useSupabaseClient();
  const { user } = useUser();
  const [name, setName] = useState(watchlist.name || '');
  const [description, setDescription] = useState(watchlist.description || '');
  const [image, setImage] = useState(watchlist.image || '');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const sharedUserIdSet = new Set(sharedUsers.map((u: any) => u.id));
  const [pendingShares, setPendingShares] = useState<string[]>(Array.from(sharedUserIdSet));
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Always update pendingShares when sharedUsers prop changes (e.g., after DB update)
  useEffect(() => {
    setPendingShares(Array.from(new Set(sharedUsers.map((u: any) => u.id))));
  }, [sharedUsers]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onload = () => setImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleShareToggle = (friendId: string) => {
    setPendingShares(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async () => {
    setLoading(true);
    let imageUrl = image;
    try {
      // 1. Upload new image if changed
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${watchlist.id}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('images').upload(fileName, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from('images').getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }
      // 2. Update watchlist
      const { error: updateError } = await supabase
        .from('watchlists')
        .update({ name, description, image: imageUrl })
        .eq('id', watchlist.id);
      if (updateError) throw updateError;
      // 3. Update sharing: add new, remove unshared
      const { data: currentShares, error: shareFetchError } = await supabase
        .from('watchlist_sharing')
        .select('shared_with_user_id')
        .eq('watchlist_id', watchlist.id);
      if (shareFetchError) throw shareFetchError;
      const currentSharedIds = (currentShares || []).map((row: any) => row.shared_with_user_id);
      const toAdd = pendingShares.filter(id => !currentSharedIds.includes(id));
      if (toAdd.length > 0) {
        const addRows = toAdd.map(id => ({ watchlist_id: watchlist.id, shared_with_user_id: id }));
        const { error: addError } = await supabase.from('watchlist_sharing').insert(addRows);
        if (addError) throw addError;
      }
      const toRemove = currentSharedIds.filter((id: string) => !pendingShares.includes(id));
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('watchlist_sharing')
          .delete()
          .eq('watchlist_id', watchlist.id)
          .in('shared_with_user_id', toRemove);
        if (removeError) throw removeError;
      }
      setLoading(false);
      onSave({ name, description, image: imageUrl, sharedWith: pendingShares });
      await refreshWatchlist(); // Ensure parent fetches latest DB state
      onClose();
    } catch (err: any) {
      setLoading(false);
      alert('Error saving: ' + (err.message || err));
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-[#232323] rounded-lg p-6 w-full max-w-md relative shadow-2xl border border-[#333]">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">✕</button>
        <h2 className="text-2xl font-bold mb-4 text-[#f6f6f6]">Edit Watchlist</h2>
        <div className="mb-4 flex flex-col items-center">
          <img src={image || '/default-watchlist.jpg'} alt="Watchlist" className="w-32 h-32 object-cover rounded mb-2 border border-[#444]" />
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
          <button onClick={() => fileInputRef.current?.click()} className="text-blue-400 underline">Change Image</button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-[#f6f6f6]">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-[#444] rounded p-2 bg-[#2e2e2e] text-[#f6f6f6] focus:outline-none" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-[#f6f6f6]">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-[#444] rounded p-2 bg-[#2e2e2e] text-[#f6f6f6] focus:outline-none" />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-[#f6f6f6]">Share with friends</label>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full p-2 mb-2 border border-[#444] rounded bg-[#2e2e2e] text-[#f6f6f6] focus:outline-none"
            placeholder="Search friends..."
          />
          <div className="max-h-40 overflow-y-auto space-y-2">
            {filteredFriends.map(friend => {
              const isShared = pendingShares.includes(friend.id);
              return (
                <div key={friend.id} className="flex justify-between items-center">
                  <span className="text-[#f6f6f6]">{friend.username}</span>
                  <button
                    onClick={() => handleShareToggle(friend.id)}
                    className={`px-2 py-1 rounded transition-colors duration-200 ${isShared ? 'bg-green-500' : 'bg-blue-500'} text-white`}
                    disabled={loading}
                  >
                    {isShared ? 'Shared' : 'Share'}
                  </button>
                </div>
              );
            })}
            {filteredFriends.length === 0 && <div className="text-gray-400 text-sm">No friends found.</div>}
          </div>
        </div>
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full mt-2 font-semibold transition-colors duration-200 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
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

  // When opening the modal, always fetch the latest shared users
  const handleOpenEditModal = () => {
    fetchSharedUsers().then(() => setIsEditModalOpen(true));
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
      {isEditModalOpen && (
        <EditWatchlistModal
          watchlist={watchlist}
          onClose={() => setIsEditModalOpen(false)}
          onSave={(updates) => {
            // After saving, re-fetch shared users to ensure modal is up-to-date
            fetchSharedUsers();
            setIsEditModalOpen(false);
          }}
          friends={friends}
          sharedUsers={sharedUsers}
          refreshWatchlist={fetchSharedUsers}
        />
      )}
    </div>
  );
};

export default MediaPage;