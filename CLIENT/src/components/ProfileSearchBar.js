import React, { useState } from 'react';
import { Search } from '@geist-ui/icons';

const ProfileSearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            onSearch(query);
        }
    };

    return (
        <div className="search-bar flex items-center border border-gray-500 rounded p-2 mb-4">
            <Search className="search-icon" color="#888888"/>
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="ml-2 bg-transparent outline-none text-white"
                placeholder="Search users..."
            />
        </div>
    );
};

export default ProfileSearchBar;
