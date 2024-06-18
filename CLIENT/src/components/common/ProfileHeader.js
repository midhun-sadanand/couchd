import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import supabase from '../../utils/supabaseClient';

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

    return (
        <header className="text-white p-4 shadow-md">
            <div className="mx-auto flex justify-between items-center" style={{ maxWidth: '85%' }}>
                <div className="my-1 mr-6">
                    <h1 className="font-bold text-2xl text-left">couchd</h1>
                    <h2 className="italic text-left">conscious media consumption</h2>
                </div>
                <div className="flex items-center">
                    {user?.imageUrl && (
                        <img
                            src={user.imageUrl}
                            alt="Profile"
                            className="w-10 h-10 rounded-full mr-4 cursor-pointer"
                            onClick={goToProfile}
                        />
                    )}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.0" stroke="currentColor" className="w-8 h-8 mr-10 cursor-pointer" onClick={goToWatchlists}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.625 3.75a2.625 2.625 0 1 0 0 5.25h12.75a2.625 2.625 0 0 0 0-5.25H5.625ZM3.75 11.25a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75ZM3 15.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75ZM3.75 18.75a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" />
                    </svg>
                    <button onClick={handleLogout} className="text-white btn shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] hover:translate-y-1 transition-all inline-block bg-stone-500 hover:bg-stone-600 text-white py-2 px-4 rounded">
                        Logout
                    </button>
                </div>
            </div>
            <div className="mx-auto mt-4 border-t-2 border-gray-600" style={{ maxWidth: '85%' }}></div>
        </header>
    );
};

export default ProfileHeader;
