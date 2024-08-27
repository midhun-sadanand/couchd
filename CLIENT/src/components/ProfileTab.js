import React from 'react';
import ActivityTab from '../components/ActivityTab'; // Import the ActivityPage component

const ProfileTab = ({ userProfile, watchlistCount, mediaCount }) => {
  return (
    <div className="p-4 w-9/10 mx-auto">
      <div className="flex items-center mb-4">
        <img
          src={userProfile.imageUrl || 'https://via.placeholder.com/150'}
          alt={userProfile.username}
          className="w-20 h-20 object-cover rounded-full mr-4"
        />
        <div>
          <h2 className="text-3xl text-left text-[#e6e6e6] font-bold">{userProfile.username}</h2>
          <div className="flex space-x-4 mt-2">
            <div>
              <span className="text-xl text-[#e6e6e6] font-bold">{watchlistCount}</span>
              <span className="text-sm text-gray-400 ml-1">Watchlists</span>
            </div>
            <div>
              <span className="text-xl text-[#e6e6e6] font-bold">{mediaCount}</span>
              <span className="text-sm text-gray-400 ml-1">Media Consumed</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">
        <ActivityTab username={userProfile.username} />
      </div>
    </div>
  );
};

export default ProfileTab;
