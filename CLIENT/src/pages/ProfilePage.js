import React, { useState, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react';
import { useCachedProfileData } from '../hooks/useCachedProfileData';
import { useWatchlists } from '../hooks/useWatchlists';
import RecentActivity from '../components/ActivityTab';
import LibrarySidebar from '../components/LibrarySidebar';
import FriendSidebar from '../components/FriendSidebar';
import ProfileTab from '../components/ProfileTab';
import WatchlistButton from '../components/WatchlistButton';

const WatchlistPage = lazy(() => import('./WatchlistPage'));

const ProfilePage = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { session } = useSession();

  const { userProfile, friendsProfiles, friendRequests } = useCachedProfileData();
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequestsState, setFriendRequests] = useState([]);
  const [hovered, setHovered] = useState({ grid: false });
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: watchlists, isLoading: isWatchlistsLoading, error } = useWatchlists(clerkUser?.id);

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

  if (error) {
    console.error('Error fetching watchlists:', error.message);
    return <div>Error loading watchlists</div>;
  }

  const watchlistCount = watchlists?.length || 0;
  const mediaCount = watchlists?.reduce((count, list) => count + (list.media?.length || 0), 0) || 0;

  const goToWatchlists = () => {
    navigate(`/profile/${userProfile.username}/lists`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#232323]">
      <nav className={`bg-[#121212] p-2 flex justify-around transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-0'} fixed top-24 left-0 w-full z-40`}>
        <span className={`cursor-pointer ${activeTab === 'profile' ? 'font-bold underline text-white' : 'text-gray-500'}`} onClick={() => setActiveTab('profile')}>
          Profile
        </span>
        <span className={`cursor-pointer ${activeTab === 'watchlists' ? 'font-bold underline text-white' : 'text-gray-500'}`} onClick={() => setActiveTab('watchlists')}>
          Lists
        </span>
        <span className={`cursor-pointer ${activeTab === 'activity' ? 'font-bold underline text-white' : 'text-gray-500'}`} onClick={() => setActiveTab('activity')}>
          Activity
        </span>
        <span className={`cursor-pointer ${activeTab === 'friends' ? 'font-bold underline text-white' : 'text-gray-500'}`} onClick={() => setActiveTab('friends')}>
          Friends
        </span>
      </nav>
      <div className="flex-grow flex mt-32">
        <LibrarySidebar watchlists={watchlists} username={username} sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`flex-grow transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-0'}`}>
          <div className="flex-grow w-full mx-auto p-4">
            <Suspense fallback={<div>Loading...</div>}>
              {activeTab === 'profile' && <ProfileTab userProfile={userProfile} watchlistCount={watchlistCount} mediaCount={mediaCount} />}
              {activeTab === 'activity' && <RecentActivity />}
              {activeTab === 'watchlists' && <WatchlistPage />}
              {activeTab === 'friends' && (
                <FriendSidebar
                  friendsProfiles={friendsProfiles}
                  friendRequests={friendRequests}
                  handleAcceptRequest={handleAcceptRequest}
                  handleRejectRequest={handleRejectRequest}
                  handleSearch={handleSearch}
                  sendFriendRequest={sendFriendRequest}
                  searchResults={searchResults}
                />
              )}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
