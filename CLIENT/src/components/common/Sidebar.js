import React from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ watchlists, username, isOpen, toggleSidebar }) => {
    const navigate = useNavigate();

    return (
        <div className={`fixed top-0 left-0 h-full bg-white shadow-lg z-50 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
            <div className="p-4">
                <button className="text-black" onClick={toggleSidebar}>
                    &times;
                </button>
                <h1 className="text-xl font-bold mt-4">Your Watchlists</h1>
                {watchlists.map((list) => (
                    <div key={list.id} className="p-2 border-b">
                        <button className="text-blue-500 hover:text-blue-600" onClick={() => navigate(`/list/${username}/${list.name}`)}>
                            {list.name}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
