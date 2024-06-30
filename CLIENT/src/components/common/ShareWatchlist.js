import React, { useState, useEffect } from 'react';

const ShareWatchlist = ({ friends, onShareToggle, pendingShares }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setFilteredFriends(friends);
  }, [friends]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);
    setFilteredFriends(friends.filter(friend => friend.username.toLowerCase().includes(value)));
  };

  return (
    <div className="relative">
      <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      </button>
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20">
          <input
            type="text"
            placeholder="Search friends"
            className="w-full px-2 py-1 border-b"
            value={searchValue}
            onChange={handleSearch}
          />
          <ul className="py-1">
            {filteredFriends.map(friend => (
              <li
                key={friend.id}
                className={`px-4 py-2 cursor-pointer hover:bg-gray-200 flex justify-between items-center`}
                onClick={() => onShareToggle(friend.id)}
              >
                <span>{friend.username}</span>
                {pendingShares.includes(friend.id) && (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-green-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShareWatchlist;
