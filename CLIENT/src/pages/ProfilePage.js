import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ProfileHeader from '../components/common/ProfileHeader';
import FriendsBar from '../components/common/FriendsBar';
import FriendRequestsDropdown from '../components/common/FriendRequests';


const ProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('Guest');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate('/');
                return;
            }

            setUserId(user.id);

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

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="w-full h-screen flex flex-col items-center justify-start pt-20">
            <h1 className="text-2xl text-center">
                Welcome back, <span className="underline">{username}</span>


                <FriendsBar userId={userId} />
                <FriendRequestsDropdown userId={userId} />

            </h1>
        </div>
    );
};

export default ProfilePage;
