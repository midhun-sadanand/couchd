import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import MovieCard from '../components/common/MovieCard';

const MediaPage = () => {
    const [mediaItems, setMediaItems] = useState([]);
    const [newMedia, setNewMedia] = useState('');
    const [medium, setMedium] = useState('Movie');
    const { username, watchlistName } = useParams();

    useEffect(() => {
        fetchMediaItems();
    }, [watchlistName]);

    const fetchMediaItems = async () => {
        const { data: watchlist } = await supabase
            .from('watchlists')
            .select('id')
            .eq('name', watchlistName)
            .single();

        if (watchlist) {
            const { data: media } = await supabase
                .from('media_items')
                .select('*')
                .eq('watchlist_id', watchlist.id);
                
            setMediaItems(media || []);
        }
    };

    const addMediaItem = async () => {
        if (!newMedia || !medium) return;

        const { data: watchlist } = await supabase
            .from('watchlists')
            .select('id')
            .eq('name', watchlistName)
            .single();

        if (watchlist) {
            const { data: newMedium } = await supabase
                .from('media_items')
                .insert([{ title: newMedia, watchlist_id: watchlist.id, medium }])
                .select();

            if (newMedium) {
                setMediaItems([...mediaItems, ...newMedium]);
                setNewMedia('');
                setMedium('Movie');
            }
        }
    };
    
    const handleDeleteMediaItem = (deletedId) => {
        setMediaItems(currentMediaItems => currentMediaItems.filter(item => item.id !== deletedId));
    };
    
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-xl font-bold">{`Media in "${watchlistName}"`}</h1>
            {mediaItems.map((item) => (
                <MovieCard 
                    key={item.id} 
                    id={item.id} 
                    title={item.title} 
                    medium={item.medium} 
                    length={item.length} 
                    date={item.date} 
                    synopsis={item.synopsis} 
                    onDelete={handleDeleteMediaItem} 
                />
            
            ))}
            <input
                type="text"
                value={newMedia}
                onChange={(e) => setNewMedia(e.target.value)}
                placeholder="Add New Media"
                className="border p-2 mt-4"
            />
            <select
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                className="border p-2 mt-4"
            >
                <option value="Movie">Movie</option>
                <option value="Book">Book</option>
                <option value="YouTube">YouTube</option>
                <option value="TV">TV Show</option>
            </select>
            <button onClick={addMediaItem} className="ml-2 bg-blue-500 text-white p-2 rounded">
                Add Media
            </button>
        </div>
    );
};

export default MediaPage;
