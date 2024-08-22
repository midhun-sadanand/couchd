import React from 'react';
import { X } from '@geist-ui/icons';

const FriendSidebar = ({
  friendsProfiles,
  friendRequests,
  handleAcceptRequest,
  handleRejectRequest,
  handleSearch,
  sendFriendRequest,
  searchResults,
  closeSidebar,
  sidebarOpen
}) => {
  return (
    <div className={`fixed top-24 right-0 h-full w-80 bg-[#232323] text-white p-4 z-40 transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Friend Activity</h2>
        <button onClick={closeSidebar} className="text-white">
          <X />
        </button>
      </div>
      <ul>
        {friendsProfiles.map(friend => (
          <li key={friend.id} className="mb-4 flex items-center">
            <img src={friend.imageUrl} alt={friend.username} className="w-10 h-10 object-cover rounded-full mr-2" />
            <div>
              <div className="font-bold">{friend.username}</div>
              <div className="text-sm text-gray-400">Last active: {friend.lastActive}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FriendSidebar;