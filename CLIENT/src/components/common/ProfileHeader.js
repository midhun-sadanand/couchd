import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import supabase from '../../utils/supabaseClient';
import SearchBar from '../SearchBar';
import { User } from '@clerk/clerk-sdk-node';

const ProfileHeader = () => {
    const navigate = useNavigate();
    const { user } = useUser();
    const { signOut: clerkSignOut } = useAuth();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        await clerkSignOut();
        navigate('/');
    };

    const goToWatchlists = () => {
        navigate('/lists');  // Navigation to watchlist page
    };

    const goToProfile = () => {
        navigate(`/profile/${user.username}`);  // Navigation to profile page
    };

    const handleSearchClick = (query) => {
        navigate(`/search?query=${encodeURIComponent(query)}`);
    };

    return (
        <header className="text-white p-4 shadow-md bg-black">
            <div className="mx-auto flex justify-between items-center" style={{ maxWidth: '85%' }}>
                <div className="my-1 mr-6">
                    <h1 className="font-bold text-2xl text-left">couchd</h1>
                    <h2 className="italic text-left">conscious media consumption</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 cursor-pointer" onClick={goToWatchlists}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                    </svg>

                    {user?.imageUrl && (
                        <div className="flex items-center space-x-2">
                            <UserButton />
                            <span className="text-white">{user.username}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="mx-auto mt-4 border-t-2 border-gray-600" style={{ maxWidth: '85%' }}></div>
        </header>
    );
};

export default ProfileHeader;
