import React, { useState, useEffect } from 'react';
import { useCachedProfileData } from '../hooks/useCachedProfileData';

interface User {
  id: string;
  username: string;
  // Add other user properties as needed
}

interface ShareWatchlistProps {
  pendingShares: string[];
  onShareToggle: (userId: string) => void;
  friends: User[];
  sharedUsers: User[];
}

const ShareWatchlist: React.FC<ShareWatchlistProps> = ({ pendingShares, onShareToggle, friends, sharedUsers }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    setFilteredFriends(friends);
  }, [friends]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchValue(value);
    if (friends) {
      setFilteredFriends(friends.filter(friend => friend.username.toLowerCase().includes(value)));
    }
  };

  const sharedFriends = filteredFriends.filter(friend => pendingShares.includes(friend.id));
  const nonSharedFriends = filteredFriends.filter(friend => !pendingShares.includes(friend.id));

  return (
    <div className="bg-[#262626] rounded-md shadow-lg z-50 p-4 w-full">
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
  );
};

export default ShareWatchlist; 