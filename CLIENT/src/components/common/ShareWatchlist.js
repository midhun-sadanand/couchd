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

  const sharedFriends = filteredFriends.filter(friend => pendingShares.includes(friend.id));
  const nonSharedFriends = filteredFriends.filter(friend => !pendingShares.includes(friend.id));

  return (
    <div className="relative">
      <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="text-white flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
        </svg>
      </button>
      <div
        className={`absolute left-full mt-2 ml-2 bg-[#262626] rounded-md shadow-lg z-20 overflow-hidden ${isDropdownOpen ? 'slide-down-fast' : 'slide-up-fast'}`}
        style={{ top: '-56%', width: '275px' }}
      >
        <input
          type="text"
          placeholder="Search friends"
          className="w-full px-2 py-1 border-b border-[#535353] bg-[#262626] placeholder-[#888888] text-[#f6f6f6] focus:outline-none"
          value={searchValue}
          onChange={handleSearch}
          style={{ fontFamily: 'EinaSemibold' }}
        />
        <ul className="py-1 text-[#f6f6f6]">
          <li className="relative flex items-center">
            <hr className="flex-grow border-t my-1" />
            <span className="absolute left-0 text-xs bg-[#262626] px-1 -translate-y-1/2" style={{ top: '50%' }}>Shared</span>
          </li>
          {sharedFriends.length > 0 ? (
            sharedFriends.map(friend => (
              <li
                key={friend.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-600 flex justify-between items-center"
                onClick={() => onShareToggle(friend.id)}
              >
                <span>{friend.username}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-green-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-[#888888]">Share your watchlist!</li>
          )}
          <li className="relative flex items-center">
            <hr className="flex-grow border-t my-1" />
            <span className="absolute left-0 text-xs bg-[#262626] px-1 -translate-y-1/2" style={{ top: '50%' }}>Unshared</span>
          </li>
          {nonSharedFriends.length > 0 ? (
            nonSharedFriends.map(friend => (
              <li
                key={friend.id}
                className="px-4 py-2 cursor-pointer hover:bg-gray-600 flex justify-between items-center"
                onClick={() => onShareToggle(friend.id)}
              >
                <span>{friend.username}</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-2 text-[#888888]">Add more friends!</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ShareWatchlist;
