import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import { arrayMoveImmutable as arrayMove } from 'array-move';
import { supabase } from '../supabaseClient';
import MovieCard from '../components/common/MovieCard';
import MovieSearch from '../components/common/MovieSearch';
import YoutubeSearch from '../components/common/YoutubeSearch';

const SortableItem = sortableElement(({ item, onDelete }) => {
    return (
      <div> {/* Wrapping in a native div element */}
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
        />
      </div>
    );
});


const SortableList = sortableContainer(({ items, onDelete }) => {
  return (
    <div>
      {items.map((item, index) => (
        <SortableItem key={`item.id`} index={index} item={item} onDelete={onDelete} />
      ))}
    </div>
  );
});

const MediaPage = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const { username, watchlistName } = useParams();

    useEffect(() => {
        fetchMediaItems();
    }, [watchlistName]);

    const fetchMediaItems = async () => {
        const { data: watchlist } = await supabase
            .from('watchlists')
            .select('id')
            .eq('name', watchlistName)
            .single()
            .select();

        if (watchlist) {
            const { data: media } = await supabase
                .from('media_items')
                .select('*')
                .eq('watchlist_id', watchlist.id)
                .order('order', { ascending: true });

            setMediaItems(media || []);
        }
    };

    const onSortEnd = async ({ oldIndex, newIndex }) => {
        const reorderedItems = arrayMove(mediaItems, oldIndex, newIndex);
        setMediaItems(reorderedItems);
    
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
        } else {  // Existing code for movies/TV shows
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

    console.log("THESE ARE DA ITEMS: ", mediaItems);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold">{`Media in "${watchlistName}"`}</h1>
            <MovieSearch onSelect={(item) => handleSelectItem(item, 'movie')} />
            <YoutubeSearch onSelect={(item) => handleSelectItem(item, 'youtube')} />
            <SortableList items={mediaItems} onSortEnd={onSortEnd} onDelete={handleDeleteMediaItem} useDragHandle={true} />
        </div>
    );
};

export default MediaPage;
