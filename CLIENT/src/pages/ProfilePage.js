import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileHeader from '../components/common/ProfileHeader';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('Guest');
    const [loading, setLoading] = useState(true);
    const [watchlistName, setWatchlistName] = useState('');
    const [showForm, setShowForm] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/');
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
            } else if (profile) {
                setUsername(profile.username);
            }

            setLoading(false);
        };

        fetchUserData();
    }, [navigate]);

    useEffect(() => {
        if (showForm) {
            inputRef.current?.focus();
        }
    }, [showForm]);



    const createWatchlist = async () => {
        if (!watchlistName) return;

    
        const { data: { user } } = await supabase.auth.getUser();

        console.log("Creating watchlist:", watchlistName);
        console.log("User:", user);
        console.log("User ID:", user.id);

        const { data, error } = await supabase
            .from('watchlists')
            .insert([
                { name: watchlistName, user_id: user.id }
            ]);

        if (error) {
            console.error('Error creating watchlist:', error.message);
        } else {
            navigate(`/${username}/${watchlistName}`);
            setShowForm(false); // Optionally reset the form
            setWatchlistName(''); // Clear the watchlist name after creation
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-start pt-20">
            <h1 className="text-2xl text-center">
                Welcome back, <span className="underline">{username}</span>
            </h1>
            <button onClick={() => setShowForm(!showForm)} className="mt-5 p-2 bg-blue-500 text-white rounded">
                New Watchlist
            </button>
            {showForm && (
                <div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={watchlistName}
                        onChange={(e) => setWatchlistName(e.target.value)}
                        placeholder="Watchlist Name"
                        className="mt-2 p-1 border border-gray-300 rounded"
                    />
                    <button onClick={createWatchlist} className="ml-2 p-1 bg-green-500 text-white rounded">
                        Create
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
