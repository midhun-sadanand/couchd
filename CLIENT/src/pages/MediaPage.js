import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import supabase from '../utils/supabaseClient';
import MovieCard from '../components/common/MovieCard';
import MovieSearch from '../components/common/MovieSearch';
import YoutubeSearch from '../components/common/YoutubeSearch';
import ShareWatchlist from '../components/common/ShareWatchlist';
import { arrayMoveImmutable as arrayMove } from 'array-move';

const MediaPage = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [watchlistId, setWatchlistId] = useState('');
    const [userId, setUserId] = useState('');
    const [username, setUsername] = useState('Guest');
    const { watchlistName } = useParams();
    const [openCards, setOpenCards] = useState({});

    useEffect(() => {
        async function fetchData() {
            const { data: user } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.user.id);
                
                // Fetch the username
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('user_id', user.user.id)
                    .single();

                if (error) {
                    console.error('Error fetching user data:', error.message);
                } else if (profile) {
                    setUsername(profile.username);
                }
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
                    <MovieCard
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        medium={item.medium}
                        length={item.length}
                        date={item.release_date}
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
                        addedBy={username}
                    />
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
                creator: item.snippet.channelTitle,
                added_by: username,  // Adding the username who creates the card
                status: 'to consume',  
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
                creator: item.director || '',
                added_by: username,  // Adding the username who creates the card
                status: 'to consume',
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
