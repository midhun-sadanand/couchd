import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useUser } from '@clerk/clerk-react';
import supabase from '../utils/supabaseClient';
import MovieCard from '../components/MovieCard';
import YouTubeCard from '../components/YoutubeCard';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import SearchBar from '../components/SearchBar';
import SearchModal from '../components/SearchModal';
import ImageUploadModal from '../components/ImageUploadModal';
import { useMediaItems } from '../hooks/useMediaItems';
import { useWatchlistData } from '../hooks/useWatchlistData';
import { useCachedProfileData } from '../hooks/useCachedProfileData';

const MediaPage = () => {
  const { watchlistName, watchlistId: paramWatchlistId } = useParams();
  const { state } = useLocation();
  const { user: clerkUser, isLoaded } = useUser();
  const { friendsProfiles } = useCachedProfileData();

  const [mediaItems, setMediaItems] = useState([]);
  const [watchlists, setWatchlists] = useState([]);
  const [watchlistId, setWatchlistId] = useState(paramWatchlistId);
  const [watchlistPublic, setWatchlistPublic] = useState(false);
  const [watchlistImage, setWatchlistImage] = useState('');
  const [watchlistDescription, setWatchlistDescription] = useState('');
  const [sharedUsers, setSharedUsers] = useState([]);
  const [openCards, setOpenCards] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [sortOption, setSortOption] = useState('Custom Order');
  const [customOrder, setCustomOrder] = useState([]);
  const inputRef = useRef(null);

  const { data: mediaItemsData, error: mediaItemsError } = useMediaItems(watchlistId);
  const { data: watchlistData, error: watchlistDataError } = useWatchlistData(watchlistId);

  console.log("SHARED USERS", sharedUsers);

  useEffect(() => {
    if (state && state.successMessage) {
      setSuccessMessage(state.successMessage);
      setShowSuccessMessage(true);
      setTimeout(() => {
        handleCloseSuccessMessage();
      }, 5000);
    }
  }, [state]);

  useEffect(() => {
    if (mediaItemsData) {
      setMediaItems(mediaItemsData);
      setCustomOrder(mediaItemsData);
    }
  }, [mediaItemsData]);

  useEffect(() => {
    if (watchlistData) {
      setWatchlistId(watchlistData.id);
      setWatchlistPublic(watchlistData.is_public);
      setWatchlistImage(watchlistData.image);
      setWatchlistDescription(watchlistData.description);
    }
  }, [watchlistData]);

  useEffect(() => {
    if (friendsProfiles) {
      setSharedUsers(friendsProfiles);
    }
  }, [friendsProfiles]);

  const handleNotesChange = async (id, notes) => {
    const { error } = await supabase.from('media_items').update({ notes }).eq('id', id);
    if (error) {
      console.error('Error updating notes:', error.message);
    } else {
      setMediaItems(currentItems => currentItems.map(item => item.id === id ? { ...item, notes } : item));
    }
  };

  const handleStatusChange = async (id, newStatus, oldStatus) => {
    const updateCounts = (counts, increment) => {
      return {
        toConsumeCount: counts.toConsumeCount + (oldStatus === 'to consume' ? -1 : 0) + (newStatus === 'to consume' ? increment : 0),
        consumingCount: counts.consumingCount + (oldStatus === 'consuming' ? -1 : 0) + (newStatus === 'consuming' ? increment : 0),
        consumedCount: counts.consumedCount + (oldStatus === 'consumed' ? -1 : 0) + (newStatus === 'consumed' ? increment : 0),
      };
    };

    setWatchlists(currentWatchlists => currentWatchlists.map(list => {
      if (list.id === watchlistId) {
        return { ...list, ...updateCounts(list, 1) };
      }
      return list;
    }));

    try {
      const { error } = await supabase
        .from('media_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setWatchlists(currentWatchlists => currentWatchlists.map(list => {
        if (list.id === watchlistId) {
          return { ...list, ...updateCounts(list, 0) };
        }
        return list;
      }));
    } catch (error) {
      console.error('Error updating status:', error.message);
      setWatchlists(currentWatchlists => currentWatchlists.map(list => {
        if (list.id === watchlistId) {
          return { ...list, ...updateCounts(list, -1) };
        }
        return list;
      }));
    }
  };

  const handleRatingChange = async (id, rating) => {
    const { error } = await supabase.from('media_items').update({ rating }).eq('id', id);
    if (error) {
      console.error('Error updating rating:', error.message);
    } else {
      setMediaItems(currentItems => currentItems.map(item => item.id === id ? { ...item, rating } : item));
    }
  };

  const setIsOpen = useCallback((id, isOpen) => {
    setOpenCards(prevOpenCards => ({ ...prevOpenCards, [id]: isOpen }));
  }, []);

  const SortableList = ({ items, onDelete }) => (
    <Droppable droppableId={`droppable-${watchlistId}`}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}>
          {items.map((item, index) => (
            <SortableItem key={item.id} item={item} index={index} onDelete={onDelete} />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  const SortableItem = ({ item, index, onDelete }) => (
    <Draggable draggableId={item.id.toString()} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}>
          {item.medium === 'YouTube' ? (
            <YouTubeCard
              key={item.id}
              id={item.id}
              title={item.title}
              medium={item.medium}
              length={item.length}
              date={item.release_date}
              created_at={item.created_at}
              synopsis={item.synopsis}
              image={item.image}
              url={item.url}
              creator={item.creator}
              status={item.status}
              notes={item.notes}
              rating={item.rating}
              onDelete={() => onDelete(item.id, item.medium)}
              onNotesChange={handleNotesChange}
              onStatusChange={handleStatusChange}
              onRatingChange={handleRatingChange}
              index={index}
              isOpen={openCards[item.id] || false}
              setIsOpen={setIsOpen}
              addedBy={clerkUser?.username || 'Guest'}
            />
          ) : (
            <MovieCard
              key={item.id}
              id={item.id}
              title={item.title}
              medium={item.medium}
              length={item.length}
              date={item.release_date}
              created_at={item.created_at}
              synopsis={item.synopsis}
              image={item.image}
              url={item.url}
              creator={item.creator}
              status={item.status}
              notes={item.notes}
              rating={item.rating}
              onDelete={() => onDelete(item.id, item.medium)}
              onNotesChange={handleNotesChange}
              onStatusChange={handleStatusChange}
              onRatingChange={handleRatingChange}
              index={index}
              isOpen={openCards[item.id] || false}
              setIsOpen={setIsOpen}
              addedBy={clerkUser?.username || 'Guest'}
            />
          )}
        </div>
      )}
    </Draggable>
  );

  const onSortEnd = async (result) => {
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

  const onShare = async (friendId) => {
    if (!watchlistId) {
      alert('Watchlist ID not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('shared_with')
        .eq('id', watchlistId)
        .single();

      if (error) {
        throw error;
      }

      const sharedWith = data.shared_with || [];
      if (sharedWith.includes(friendId)) {
        alert('Watchlist already shared with this friend.');
        return;
      }

      sharedWith.push(friendId);

      const { error: updateError } = await supabase
        .from('watchlists')
        .update({ shared_with: sharedWith })
        .eq('id', watchlistId);

      if (updateError) {
        throw updateError;
      }

      alert('Watchlist shared successfully!');
    } catch (error) {
      console.error('Error sharing watchlist:', error.message);
      alert('Failed to share watchlist.');
    }
  };

  const onUnshare = async (friendId) => {
    if (!watchlistId) {
      alert('Watchlist ID not available');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .select('shared_with')
        .eq('id', watchlistId)
        .single();

      if (error) {
        throw error;
      }

      let sharedWith = data.shared_with || [];
      if (!sharedWith.includes(friendId)) {
        alert('Watchlist is not shared with this friend.');
        return;
      }

      sharedWith = sharedWith.filter(id => id !== friendId);

      const { error: updateError } = await supabase
        .from('watchlists')
        .update({ shared_with: sharedWith })
        .eq('id', watchlistId);

      if (updateError) {
        throw updateError;
      }

      alert('Watchlist unshared successfully!');
    } catch (error) {
      console.error('Error unsharing watchlist:', error.message);
      alert('Failed to unshare watchlist.');
    }
  };

  const addSharedUser = (user) => {
    setSharedUsers((prev) => [...prev, user]);
  };

  const removeSharedUser = (userId) => {
    setSharedUsers((prev) => prev.filter(user => user.id !== userId));
  };

  const handleSelectItem = async (item, type) => {
    let newMedia;
    let releaseDate = item.release_date || '';
    if (!releaseDate) {
      releaseDate = null; // Set to null if empty
    }

    if (type === 'youtube') {
      const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
      const imageUrl = item.snippet.thumbnails.default.url;
      newMedia = await supabase.from('media_items').insert([{
        title: item.snippet.title,
        medium: 'YouTube',
        watchlist_id: watchlistId,
        image: imageUrl,
        url: videoUrl,
        release_date: item.snippet.publishedAt.substring(0, 10),
        creator: item.snippet.channelTitle,
        added_by: clerkUser?.username || 'Guest',
        status: 'to consume',
        order: mediaItems.length
      }]).select();
    } else if (type === 'movies') {
      const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
      newMedia = await supabase.from('media_items').insert([{
        title: item.title || item.name,
        medium: 'Movie',
        watchlist_id: watchlistId,
        image: imageUrl,
        release_date: releaseDate,
        creator: item.director || '',
        added_by: clerkUser?.username || 'Guest',
        status: 'to consume',
        order: mediaItems.length
      }]).select();
    } else if (type === 'TV shows') {
      const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
      const creator = item.created_by && item.created_by.length > 0 ? item.created_by[0].name : ''; // Get the creator name
      newMedia = await supabase.from('media_items').insert([{
        title: item.title || item.name,
        medium: 'TV Show',
        watchlist_id: watchlistId,
        image: imageUrl,
        release_date: releaseDate,
        creator: item.creator || item.created_by,
        added_by: clerkUser?.username || 'Guest',
        status: 'to consume',
        order: mediaItems.length
      }]).select();
    }

    const { data, error } = newMedia;
    if (error) {
      console.error('Failed to add item:', error.message);
    } else {
      setMediaItems([...mediaItems, ...data]);
      setCustomOrder([...mediaItems, ...data]);
    }
  };

  const handleDeleteMediaItem = async (deletedId, medium) => {
    if (window.confirm(`Are you sure you want to delete this ${medium}?`)) {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .match({ id: deletedId });

      if (error) {
        console.error('Error deleting media item:', error.message);
      } else {
        setMediaItems(currentMediaItems => currentMediaItems.filter(item => item.id !== deletedId));
        setCustomOrder(currentMediaItems => currentMediaItems.filter(item => item.id !== deletedId));
      }
    }
  };

  const handleCloseSuccessMessage = () => {
    setShowSuccessMessage(false);
    setTimeout(() => {
      setSuccessMessage('');
    }, 500);
  };

  const handleSearchClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSortChange = (e) => {
    const sortOption = e.target.value;
    setSortOption(sortOption);

    let sortedMediaItems;
    switch (sortOption) {
      case 'Date Added':
        sortedMediaItems = [...mediaItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'Date Modified':
        sortedMediaItems = [...mediaItems].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        break;
      case 'Title':
        sortedMediaItems = [...mediaItems].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'Added By':
        sortedMediaItems = [...mediaItems].sort((a, b) => a.added_by.localeCompare(b.added_by));
        break;
      case 'Custom Order':
      default:
        sortedMediaItems = [...customOrder];
        break;
    }

    setMediaItems(sortedMediaItems);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.metaKey && e.key === 'k') {
        e.preventDefault();
        setIsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

  const handleImageUpload = (url) => {
    setWatchlistImage(url);
  };

  const handleOpenImageUploadModal = () => {
    setIsImageUploadModalOpen(true);
  };

  const handleCloseImageUploadModal = (newDescription, newIsPublic, newSharedUsers) => {
    setIsImageUploadModalOpen(false);
    if (newDescription) {
      setWatchlistDescription(newDescription);
    }
    setWatchlistPublic(newIsPublic);
    setSharedUsers(newSharedUsers); // Update sharedUsers state
  };

  const handleImageError = (e) => {
    console.error('Error loading image:', e.target.src);
    e.target.src = 'https://via.placeholder.com/150';
  };

  return (
    <div className="container mx-auto top-24 p-4 dark:bg-gray-800 dark:text-white relative w-full">
      <div className="flex justify-between items-start mb-4 w-full">
        <div className="flex items-start space-x-4">
          <div className="relative w-48 h-48 mb-4">
            {watchlistImage ? (
              <img
                src={watchlistImage}
                alt="Watchlist"
                className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
                onError={handleImageError}
                loading="lazy"
                onMouseEnter={(e) => e.target.classList.add('opacity-50')}
                onMouseLeave={(e) => e.target.classList.remove('opacity-50')}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No Image</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 hover:opacity-100">
              <button
                onClick={handleOpenImageUploadModal}
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
            <p className="text-sm text-gray-400 text-left">{watchlistPublic ? 'Public watchlist' : 'Private watchlist'}</p>
            <h1 className="watchlist-title text-5xl font-bold text-white text-left cursor-pointer" onClick={handleOpenImageUploadModal}>
              {watchlistName}
            </h1>
            <p className="watchlist-description text-lg text-gray-300 text-left mb-7 flex-grow">
              {watchlistDescription}
            </p>
            <div className="flex bottom:0 items-center">
              <div className="flex items-center" style={{ minWidth: `${sharedUsers.length * 20 + 40}px` }}>
                <img
                  src={clerkUser?.imageUrl}
                  alt="Owner"
                  className="w-8 h-8 rounded-full shadow-2xl align-bottom border border-[#535353] z-20"
                />
                {sharedUsers.map((user, index) => (
                  <img
                    key={user.id}
                    src={user.imageUrl}
                    alt={user.username}
                    className="w-8 h-8 rounded-full shadow-2xl border border-[#535353]"
                    style={{ marginLeft: -15, zIndex: 19 - index }}
                    loading="lazy"
                  />
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {clerkUser?.username}, {sharedUsers.map(user => user.username).join(', ')} • {mediaItems.length} media
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-start">
          <SearchBar onSearchClick={handleSearchClick} style={{ fontFamily: 'GeistRegular' }}/>
        </div>
      </div>
      <div className="flex justify-end items-center mb-4 w-full" style={{ marginTop: '-65px' }}>
        <div className="flex items-center">
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="ml-4 bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="Custom Order">Custom Order</option>
            <option value="Date Added">Date Added</option>
            <option value="Date Modified">Date Modified</option>
            <option value="Title">Title</option>
            <option value="Added By">Added By</option>
          </select>
        </div>
      </div>
      {showSuccessMessage && (
        <div className="alert alert-success w-full">
          {successMessage}
        </div>
      )}
      <DragDropContext onDragEnd={onSortEnd}>
        <SortableList items={mediaItems} onDelete={(id, medium) => handleDeleteMediaItem(id, medium)} />
      </DragDropContext>
      {isModalOpen && <SearchModal onSelect={handleSelectItem} onClose={handleModalClose} inputRef={inputRef} />}
      {isImageUploadModalOpen && (
        <ImageUploadModal
          watchlistId={watchlistId}
          onClose={handleCloseImageUploadModal}
          onShare={onShare}
          onUnshare={onUnshare}
          friends={friends}
          sharedUsers={sharedUsers}
          onImageUpload={handleImageUpload}
          watchlistName={watchlistName}
          watchlistDescription={watchlistDescription}
          watchlistImage={watchlistImage}
          username={clerkUser.username}
          addSharedUser={addSharedUser}
          removeSharedUser={removeSharedUser}
        />
      )}
    </div>
  );
};

export default MediaPage;