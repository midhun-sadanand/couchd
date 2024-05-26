import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import MovieCard from '../components/common/MovieCard';
import MovieSearch from '../components/common/MovieSearch';
import YoutubeSearch from '../components/common/YoutubeSearch';
import ShareWatchlist from '../components/common/ShareWatchlist';
import { arrayMoveImmutable as arrayMove } from 'array-move';

const MediaPage = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [watchlistId, setWatchlistId] = useState('');
    const [userId, setUserId] = useState('');
    const { watchlistName } = useParams();

    useEffect(() => {
        async function fetchData() {
            const { data: user } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.user.id);
            }

            const { data: watchlist } = await supabase
                .from('watchlists')
                .select('id')
                .eq('name', watchlistName)
                .single();

            if (watchlist) {
                setWatchlistId(watchlist.id);
                const { data: media } = await supabase
                    .from('media_items')
                    .select('*')
                    .eq('watchlist_id', watchlist.id)
                    .order('order', { ascending: true });

                setMediaItems(media || []);
            }
        }

        fetchData();
    }, [watchlistName]);

    const fetchMediaItems = async () => {
        const { data: watchlist } = await supabase
            .from('watchlists')
            .select('id')
            .eq('name', watchlistName)
            .single();

        if (watchlist) {
            setWatchlistId(watchlist.id);
            const { data: media } = await supabase
                .from('media_items')
                .select('*')
                .eq('watchlist_id', watchlist.id)
                .order('order', { ascending: true });

            setMediaItems(media || []);
        }
    };

    
    const SortableList = ({ items, onDelete, watchlistName }) => (
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
            <MovieCard
              key={item.id}
              id={item.id}
              title={item.title}
              medium={item.medium}
              length={item.length}
              date={item.release_date.substring(0, 4)}
              synopsis={item.synopsis}
              image={item.image}
              url={item.url}
              onDelete={() => onDelete(item.id, item.medium)}
              index={index}
            />
          </div>
        )}
      </Draggable>
    );
    
    const onSortEnd = async (result) => {
        if (!result.destination) return;
    
        const reorderedItems = arrayMove(mediaItems, result.source.index, result.destination.index);
        setMediaItems(reorderedItems);
    
        // Since you're using await, the function must be marked as async
        try {
            await Promise.all(reorderedItems.map((item, index) => 
                supabase.from('media_items').update({ order: index }).match({ id: item.id })
            ));
        } catch (error) {
            console.error('Error updating order on backend:', error);
            // Optionally rollback to previous state
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
        if (type === 'youtube') {
            const videoUrl = `https://www.youtube.com/watch?v=${item.id.videoId}`;
            const imageUrl = item.snippet.thumbnails.high.url;
            newMedia = await supabase.from('media_items').insert([{
                title: item.snippet.title,
                medium: 'YouTube',
                watchlist_id: (await supabase.from('watchlists').select('id').eq('name', watchlistName).single()).data.id,
                image: imageUrl,
                url: videoUrl,  // Storing YouTube video URL
                release_date: item.snippet.publishedAt.substring(0, 10),
                order: mediaItems.length
            }])
            .select();
        } else { 
            const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '';
            newMedia = await supabase.from('media_items').insert([{
                title: item.title || item.name,
                medium: item.media_type === 'movie' ? 'Movie' : 'TV',
                watchlist_id: (await supabase.from('watchlists').select('id').eq('name', watchlistName).single()).data.id,
                image: imageUrl,
                release_date: item.release_date || '',
                order: mediaItems.length
            }])
            .select();
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

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold">{`Media in "${watchlistName}"`}</h1>
            <MovieSearch onSelect={(item) => handleSelectItem(item, 'movie')} />
            <YoutubeSearch onSelect={(item) => handleSelectItem(item, 'youtube')} />
            <DragDropContext onDragEnd={onSortEnd}>
                <SortableList items={mediaItems} onDelete={(id, medium) => handleDeleteMediaItem(id, medium)} />
            </DragDropContext>
            {userId && <ShareWatchlist onShare={onShare} userId={userId} />}
        </div>
    );
};

export default MediaPage;
