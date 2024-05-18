import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; // Ensure the path is correct

const ProfileHeader = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <header className="bg-zinc-700 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="my-1 mr-6">
                    <h1 className="font-bold text-2xl text-left">kittler</h1>
                    <h2 className="italic text-left">switch off all apparatuses.</h2>
                </div>
                <button onClick={handleLogout} className="bg-stone-500 hover:bg-stone-600 text-white py-2 px-4 rounded">
                    Logout
                </button>
            </div>
        </header>
    );
};

export default ProfileHeader;
