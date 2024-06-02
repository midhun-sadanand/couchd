import React from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../utils/supabaseClient';
import { useAuth } from '@clerk/clerk-react';

const ProfileHeader = () => {
    const navigate = useNavigate();
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
        navigate('/profile');  // Navigation to profile page
    };

    return (
        <header className="bg-zinc-700 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="my-1 mr-6">
                    <h1 className="font-bold text-2xl text-left">kittler</h1>
                    <h2 className="italic text-left">switch off all apparatuses.</h2>
                </div>
                <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-8 h-8 mr-10" onClick={goToProfile}>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.0" stroke="currentColor" className="w-8 h-8 mr-10" onClick={goToWatchlists}>
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
                    </svg>

                    <button onClick={handleLogout} className="text-white btn shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] hover:translate-y-1 transition-all inline-block bg-stone-500 hover:bg-stone-600 text-white py-2 px-4 rounded">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ProfileHeader;
