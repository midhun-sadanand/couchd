import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileHeader from '../components/common/ProfileHeader';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('Guest');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser() // Gets the current user details
            // console.log("DATA", user);
            // console.log("USERID", user.id);

            if (!user) {
                navigate('/'); // If no user is found, redirect to login
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('user_id', user.id)
                .single();
            
            if (error) {
                console.error('Error fetching user data:', error.message);
                navigate('/'); // Handle errors possibly by redirecting to login or showing a message
            } else if (profile) {
                setUsername(profile.username);
            }

            setLoading(false);
        };

        fetchUserData();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/'); // Redirects user to login page after logout
    };

    if (loading) {
        return <div>Loading...</div>; // Optionally handle loading state better
    }

    return (
        <div className="w-full h-screen flex flex-col">
            <div className="flex-grow flex items-center justify-center">
                <h1 className="text-2xl text-center">Welcome back, {username}</h1>
            </div>
        </div>
    );
};

export default ProfilePage;
