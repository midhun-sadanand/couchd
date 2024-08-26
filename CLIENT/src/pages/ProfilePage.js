import React, { useState, lazy, Suspense, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react';
import { useCachedProfileData } from '../hooks/useCachedProfileData';
import { useWatchlists } from '../hooks/useWatchlists';
import { useSharedUsers } from '../hooks/useSharedUsers';
import RecentActivity from '../components/ActivityTab';
import LibrarySidebar from '../components/LibrarySidebar';
import FriendSidebar from '../components/FriendSidebar';
import ProfileTab from '../components/ProfileTab';
import { Grid, Users, User, Sidebar } from '@geist-ui/icons';

const WatchlistPage = lazy(() => import('./WatchlistPage'));

const ProfilePage = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { session } = useSession();

  const { userProfile, friendsProfiles, friendRequests } = useCachedProfileData();
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequestsState, setFriendRequests] = useState([]);
  const [hovered, setHovered] = useState({ sidebar: false, profile: false, watchlists: false, friends: false });
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);

  const { data: watchlistData, isLoading: isWatchlistsLoading, error: watchlistsError } = useWatchlists(clerkUser?.id);
  const { watchlists, ownerships, ownerIds } = watchlistData || {};
  const { data: sharedUsersData, error: sharedUsersError } = useSharedUsers(ownerIds);

  const sendFriendRequest = async (receiverId, receiverUsername) => {
    try {
      const token = await session.getToken();
      await fetch('http://localhost:3001/api/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId: clerkUser.id, senderUsername: clerkUser.username, receiverId, receiverUsername }),
      });
    } catch (error) {
      console.error('Error sending friend request:', error.message);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = await session.getToken();
      await fetch('http://localhost:3001/api/friend-request/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      setFriendRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = await session.getToken();
      await fetch('http://localhost:3001/api/friend-request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      setFriendRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error.message);
    }
  };

  const handleSearch = async (query) => {
    try {
      const token = await session.getToken();
      const response = await fetch(`http://localhost:3001/api/search?query=${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    }
  };

  if (!isUserLoaded || !session || !clerkUser || !userProfile || isWatchlistsLoading) {
    return <div>Loading...</div>;
  }

  if (watchlistsError) {
    console.error('Error fetching watchlists:', watchlistsError.message);
    return <div>Error loading watchlists</div>;
  }

  if (sharedUsersError) {
    console.error('Error fetching shared users:', sharedUsersError.message);
    return <div>Error loading user data</div>;
  }

  const watchlistCount = watchlists?.length || 0;
  const mediaCount = watchlists?.reduce((count, list) => count + (list.media?.length || 0), 0) || 0;

  const goToWatchlists = () => {
    navigate(`/profile/${userProfile.username}/lists`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setHovered({ ...hovered, sidebar: false });
  };

  const toggleFriendsSidebar = () => {
    setFriendsSidebarOpen(!friendsSidebarOpen);
  };

  // Merge watchlists with sharedUsersData to get the owner names
  const watchlistsWithOwners = watchlists?.map(watchlist => {
    const ownership = ownerships.find(own => own.watchlist_id === watchlist.id);
    const owner = sharedUsersData?.find(user => user.id === ownership.user_id);
    return {
      ...watchlist,
      ownerName: owner ? owner.username : 'Unknown',
    };
  });

  const sidebarWidth = sidebarOpen ? '240px' : '0'; // Adjusting the width of the library sidebar
  const friendSidebarWidth = friendsSidebarOpen ? '240px' : '0'; // Adjusting the width of the friend sidebar

  return (
    <div className="w-screen h-screen flex flex-col bg-[#232323]">
      <nav className={`bg-[#121212] p-2 flex justify-between transition-all duration-300 fixed top-24 left-0 w-full z-40 rounded-lg`} style={{ marginLeft: sidebarWidth, marginRight: friendSidebarWidth }}>
        <div className="flex space-x-4">
          {!sidebarOpen && (
            <div className="relative group">
              <Sidebar
                size={28}
                className="cursor-pointer transition-colors duration-300"
                color={hovered.sidebar ? '#f6f6f6' : '#777777'}
                onMouseEnter={() => setHovered({ ...hovered, sidebar: true })}
                onMouseLeave={() => setHovered({ ...hovered, sidebar: false })}
                onClick={toggleSidebar}
              />
              {activeTab === 'sidebar' && (
                <div className="absolute bottom-[-4px] left-0 right-0 h-0.5 w-2/3 mx-auto bg-[#777777] group-hover:bg-[#f6f6f6]" />
              )}
            </div>
          )}
          <div className="relative group">
            <User
              size={28}
              className="cursor-pointer transition-colors duration-300"
              color={hovered.profile ? '#f6f6f6' : '#777777'}
              onMouseEnter={() => setHovered({ ...hovered, profile: true })}
              onMouseLeave={() => setHovered({ ...hovered, profile: false })}
              onClick={() => setActiveTab('profile')}
            />
            {activeTab === 'profile' && (
              <div className="absolute bottom-[-4px] left-0 right-0 h-0.5 w-2/3 mx-auto bg-[#777777] group-hover:bg-[#f6f6f6]" />
            )}
          </div>
          <div className="relative group">
            <Grid
              size={28}
              className="cursor-pointer transition-colors duration-300"
              color={hovered.watchlists ? '#f6f6f6' : '#777777'}
              onMouseEnter={() => setHovered({ ...hovered, watchlists: true })}
              onMouseLeave={() => setHovered({ ...hovered, watchlists: false })}
              onClick={() => setActiveTab('watchlists')}
            />
            {activeTab === 'watchlists' && (
              <div className="absolute bottom-[-4px] left-0 right-0 h-0.5 w-2/3 mx-auto bg-[#777777] group-hover:bg-[#f6f6f6]" />
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4 fixed right-8">
          <div className="relative group">
            <Users
              size={28}
              color={hovered.friends ? '#f6f6f6' : '#777777'}
              className="cursor-pointer transition-colors duration-300"
              onMouseEnter={() => setHovered({ ...hovered, friends: true })}
              onMouseLeave={() => setHovered({ ...hovered, friends: false })}
              onClick={toggleFriendsSidebar}
            />
            {friendsSidebarOpen && (
              <div className="absolute bottom-[-4px] left-0 right-0 h-0.5 w-2/3 mx-auto bg-[#777777] group-hover:bg-[#f6f6f6]" />
            )}
          </div>
        </div>
      </nav>
      <div className="flex-grow flex mt-32">
        <LibrarySidebar watchlists={watchlistsWithOwners} username={username} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`flex-grow transition-all duration-300`} style={{ marginLeft: sidebarWidth, marginRight: friendSidebarWidth }}>
          <div className="flex-grow w-full mx-auto p-4">
            <Suspense fallback={<div>Loading...</div>}>
              {activeTab === 'profile' && <ProfileTab userProfile={userProfile} watchlistCount={watchlistCount} mediaCount={mediaCount} />}
              {activeTab === 'watchlists' && (
                <WatchlistPage 
                  isFriendSidebarOpen={friendsSidebarOpen} 
                  isLibrarySidebarOpen={sidebarOpen}  // Pass both sidebar states as props
                />
              )}
            </Suspense>
          </div>
        </div>
        <FriendSidebar
          friendsProfiles={friendsProfiles}
          friendRequests={friendRequests}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
          handleSearch={handleSearch}
          sendFriendRequest={sendFriendRequest}
          searchResults={searchResults}
          closeSidebar={toggleFriendsSidebar}
          sidebarOpen={friendsSidebarOpen}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
