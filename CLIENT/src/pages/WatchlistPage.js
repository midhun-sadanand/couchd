import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const WatchlistPage = () => {
    const [watchlists, setWatchlists] = useState([]);
    const [watchlistName, setWatchlistName] = useState('');
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/login');
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.error('Error fetching user data:', error.message);
                navigate('/');
            } else {
                setUsername(profile.username);
                fetchWatchlists(user.id);
            }
        };

        fetchUserData();
    }, [navigate]);

    const fetchWatchlists = async (userId) => {
        // Query to fetch watchlists that the user owns
        const ownWatchlistsQuery = supabase
            .from('watchlists')
            .select('*')
            .eq('user_id', userId);
    
        // Query to fetch watchlists that are shared with the user
        const sharedWatchlistsQuery = supabase
            .from('watchlist_shares')
            .select(`
                watchlist_id,
                watchlist:watchlist_id (id, name, user_id)  // Assuming a foreign key from watchlist_shares to watchlists
            `)
            .eq('shared_with_user_id', userId);
    
        try {
            let { data: ownWatchlists, error: ownError } = await ownWatchlistsQuery;
            let { data: sharedWatchlistsData, error: sharedError } = await sharedWatchlistsQuery;
    
            if (ownError) {
                console.error('Error fetching own watchlists:', ownError.message);
                return;
            }
            if (sharedError) {
                console.error('Error fetching shared watchlists:', sharedError.message);
                return;
            }
    
            // Map shared watchlists to have the same structure as own watchlists
            const sharedWatchlists = sharedWatchlistsData.map(item => item.watchlist);
    
            // Combine own and shared watchlists
            const combinedWatchlists = [...ownWatchlists, ...sharedWatchlists];
            setWatchlists(combinedWatchlists);
        } catch (error) {
            console.error('Error fetching watchlists:', error.message);
        }
    };
    

    const createWatchlist = async () => {
        if (!watchlistName) return;

        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('watchlists')
            .insert([{ name: watchlistName, user_id: user.id }]);

        if (error) {
            console.error('Error creating watchlist:', error.message);
        } else {
            setWatchlists([...watchlists, ...data]); // Update local state with new watchlist
            navigate(`/${username}/${watchlistName}`);
            setWatchlistName(''); // Clear the field after creation
        }
    };

    const deleteWatchlist = async (deletedId) => {
        if (window.confirm(`Are you sure you want to delete this list?`)) {
            const { error } = await supabase
                .from('watchlists')
                .delete()
                .match({ id: deletedId });

            if (error) {
                console.error('Error deleting list:', error.message);
            } else {
                setWatchlists(currentWatchlists => currentWatchlists.filter(list => list.id !== deletedId));
            }
        }
    };

    return (
        <div className="container mx-auto p-4 grid grid-cols-3">
            <h1 className="text-xl font-bold col-span-3">Your Watchlists</h1>
            <div className="col-span-3 flex justify-end">
                <input
                    type="text"
                    value={watchlistName}
                    onChange={(e) => setWatchlistName(e.target.value)}
                    placeholder="Enter Watchlist Name"
                    className="border p-2 my-4"
                />
                <button onClick={() => createWatchlist()} className="ml-2 my-4 bg-blue-500 text-white p-2 rounded">
                    Create Watchlist
                </button>
            </div>
            {watchlists.map((list) => (
                <div key={list.id} className="p-2 m-4 border-2">
                    <button className="text-blue-500 hover:text-blue-600" onClick={() => navigate(`/list/${username}/${list.name}`)}>
                        {list.name}
                    </button>
                    <button className="block hover:underline" onClick={() => deleteWatchlist(list.id)}>remove</button>
                </div>
            ))}
        </div>
    );
};

export default WatchlistPage;
