import React, { useState } from 'react';
import ProfileSearchBar from '../components/ProfileSearchBar';
import defaultProfile from '../components/assets/images/pfp.png';

const FriendSidebar = ({ friendsProfiles, friendRequests, handleAcceptRequest, handleRejectRequest, handleSearch, sendFriendRequest, searchResults }) => {
  const [showFriendOptions, setShowFriendOptions] = useState(false);

  const toggleFriendOptions = () => {
    setShowFriendOptions(!showFriendOptions);
  };

  return (
    <div className="bg-[#232323] text-white p-4 max-w-4xl w-full mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl">Friends</h2>
        <button onClick={toggleFriendOptions} className="text-blue-500">Add Friend</button>
      </div>
      {showFriendOptions && (
        <div className="mb-8">
          <ProfileSearchBar onSearch={handleSearch} />
          <div>
            <h2 className="text-2xl mb-4">Search Results</h2>
            {searchResults.map(u => (
              <div key={u.id} className="border-b flex justify-between py-2">
                <span className="cursor-pointer">
                  <img src={u.profile_image_url || defaultProfile} alt="Profile" className="w-8 h-8 rounded-full mr-2" />
                  {u.username}
                </span>
                <button onClick={() => sendFriendRequest(u.id, u.username)} className="text-blue-500">Add Friend</button>
              </div>
            ))}
          </div>
          <div>
            <h2 className="text-2xl mb-4">Friend Requests</h2>
            {friendRequests?.map(request => (
              <div key={request.id} className="border-b flex justify-between py-2">
                <span>{request.sender_username}</span>
                <div>
                  <button onClick={() => handleAcceptRequest(request.id)} className="text-green-500 mr-2">Accept</button>
                  <button onClick={() => handleRejectRequest(request.id)} className="text-red-500">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        {friendsProfiles?.map(friend => (
          <div key={friend.id} className="border-b flex items-center py-2">
            <img src={friend.profile_image_url || defaultProfile} alt="Profile" className="w-10 h-10 rounded-full mr-2" />
            <span>{friend.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendSidebar;
