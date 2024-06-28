import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useUser } from '@clerk/clerk-react';
import supabase from '../utils/supabaseClient';
import MovieCard from '../components/MovieCard';
import YouTubeCard from '../components/YoutubeCard';
import ShareWatchlist from '../components/common/ShareWatchlist';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import SearchBar from '../components/SearchBar';
import SearchModal from '../components/SearchModal';
import ImageUploadModal from '../components/ImageUploadModal';

const MediaPage = () => {
  const [mediaItems, setMediaItems] = useState([]);
  const [watchlistId, setWatchlistId] = useState('');
  const [watchlistPublic, setWatchlistPublic] = useState(false);
  const [watchlistImage, setWatchlistImage] = useState('');
  const [watchlistDescription, setWatchlistDescription] = useState('');
  const { user: clerkUser, isLoaded } = useUser();
  const { watchlistName, watchlistId: paramWatchlistId } = useParams();
  const { state } = useLocation();
  const [openCards, setOpenCards] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (state && state.successMessage) {
      setSuccessMessage(state.successMessage);
      setShowSuccessMessage(true);
      setTimeout(() => {
        handleCloseSuccessMessage();
      }, 5000);
    }

    async function fetchData() {
      if (isLoaded && clerkUser && paramWatchlistId) {
        try {
          const { data: watchlist, error: watchlistError } = await supabase
            .from('watchlists')
            .select('id, name, is_public, image, description')
            .eq('id', paramWatchlistId)
            .single();

          if (watchlistError) {
            throw watchlistError;
          }

          if (watchlist) {
            setWatchlistId(watchlist.id);
            setWatchlistPublic(watchlist.is_public);
            setWatchlistImage(watchlist.image);
            setWatchlistDescription(watchlist.description);
            const { data: media, error: mediaError } = await supabase
              .from('media_items')
              .select('*')
              .eq('watchlist_id', watchlist.id)
              .order('order', { ascending: true });

            if (mediaError) {
              throw mediaError;
            }

            setMediaItems(media || []);
          }
        } catch (error) {
          console.error('Error fetching data:', error.message);
        }
      }
    }

    fetchData();
  }, [paramWatchlistId, clerkUser, isLoaded, state]);

  const fetchMediaItems = async () => {
    try {
      const { data: watchlist, error: watchlistError } = await supabase
        .from('watchlists')
        .select('id, name, is_public, image, description')
        .eq('id', paramWatchlistId)
        .single();

      if (watchlistError) {
        throw watchlistError;
      }

      if (watchlist) {
        setWatchlistId(watchlist.id);
        setWatchlistPublic(watchlist.is_public);
        setWatchlistImage(watchlist.image);
        setWatchlistDescription(watchlist.description);
        const { data: media, error: mediaError } = await supabase
          .from('media_items')
          .select('*')
          .eq('watchlist_id', watchlist.id)
          .order('order', { ascending: true });

        if (mediaError) {
          throw mediaError;
        }

        setMediaItems(media || []);
      }
    } catch (error) {
      console.error('Error fetching media items:', error.message);
    }
  };

  const handleNotesChange = async (id, notes) => {
    const { error } = await supabase.from('media_items').update({ notes }).eq('id', id);
    if (error) {
      console.error('Error updating notes:', error.message);
    } else {
      setMediaItems(currentItems => currentItems.map(item => item.id === id ? { ...item, notes } : item));
    }
  };

  const handleStatusChange = async (id, status) => {
    const { error } = await supabase.from('media_items').update({ status }).eq('id', id);
    if (error) {
      console.error('Error updating status:', error.message);
    } else {
      setMediaItems(currentItems => currentItems.map(item => item.id === id ? { ...item, status } : item));
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
              addedBy={clerkUser.username || 'Guest'}
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
              addedBy={clerkUser.username || 'Guest'}
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

    try {
      await Promise.all(reorderedItems.map((item, index) =>
        supabase.from('media_items').update({ order: index }).match({ id: item.id })
      ));
    } catch (error) {
      console.error('Error updating order on backend:', error);
      fetchMediaItems();
    }
  };

  const onShare = async (friendId) => {
    if (!watchlistId) {
      alert('Watchlist ID not available');
      return;
    }

    const { error } = await supabase
      .from('watchlist_shares')
      .insert([{
        watchlist_id: watchlistId,
        shared_with_user_id: friendId,
        permission_type: 'edit'
      }]);

    if (error) {
      console.error('Failed to share watchlist:', error.message);
      alert('Failed to share watchlist.');
    } else {
      alert('Watchlist shared successfully!');
    }
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
        added_by: clerkUser.username || 'Guest',
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
        added_by: clerkUser.username || 'Guest',
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
        added_by: clerkUser.username || 'Guest',
        status: 'to consume',
        order: mediaItems.length
      }]).select();
    }

    const { data, error } = newMedia;
    if (error) {
      console.error('Failed to add item:', error.message);
    } else {
      setMediaItems([...mediaItems, ...data]);
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

  // Add useEffect to handle Command + K
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

  const handleCloseImageUploadModal = (newDescription, newIsPublic) => {
    setIsImageUploadModalOpen(false);
    if (newDescription) {
      setWatchlistDescription(newDescription);
    }
    setWatchlistPublic(newIsPublic);
  };

  const handleImageError = (e) => {
    console.error('Error loading image:', e.target.src);
    e.target.src = 'https://via.placeholder.com/150';
  };

  return (
    <div className="container mx-auto p-4 dark:bg-gray-800 dark:text-white relative w-full">
      <div className="flex justify-between items-start mb-4 w-full">
        <div className="flex items-start space-x-4">
          <div className="relative w-40 h-40 mb-4">
            {watchlistImage ? (
              <img
                src={watchlistImage}
                alt="Watchlist"
                className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
                onError={handleImageError}
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 mb-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                <span>Edit watchlist</span>
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-start ">
            <p className="text-sm text-gray-400 text-left">{watchlistPublic ? 'Public watchlist' : 'Private watchlist'}</p>
            <h1 className="text-5xl font-bold text-white text-left cursor-pointer" onClick={handleOpenImageUploadModal}>{watchlistName}</h1>
            <p className="text-lg text-gray-300 text-left">{watchlistDescription}</p>
            <div className="flex items-center mt-2">
              <img
                src={clerkUser?.imageUrl}
                alt="Owner"
                className="w-8 h-8 rounded-full mt-5 mr-2 align-bottom"
              />
              <span className="text-sm mt-5 text-gray-400">{clerkUser?.username} • {mediaItems.length} media</span>
            </div>
          </div>
        </div>
        <div className="search-bar-container self-end">
          <SearchBar onSearchClick={handleSearchClick} />
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
          onImageUpload={handleImageUpload}
          watchlistName={watchlistName}
          watchlistDescription={watchlistDescription}
          watchlistImage={watchlistImage}
          username={clerkUser.username}
        />
      )}
    </div>
  );
};

export default MediaPage;
