"use client";

import { useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { useUser, useSession } from '@clerk/nextjs';
import { Grid, Users, User, Sidebar } from '@geist-ui/icons';
import { useSupabase } from '@/utils/auth';

import { useCachedProfileData } from '@/hooks/useCachedProfileData';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useSharedUsers } from '@/hooks/useSharedUsers';
import RecentActivity from '@/components/ActivityTab';
import LibrarySidebar from '@/components/LibrarySidebar';
import FriendSidebar from '@/components/FriendSidebar';
import ProfileTab from '@/components/ProfileTab';
import WatchlistPage from '@/components/WatchlistPage';

interface HoverState {
  sidebar: boolean;
  profile: boolean;
  watchlists: boolean;
  friends: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { session } = useSession();
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  const [searchResults, setSearchResults] = useState([]);
  const [friendRequestsState, setFriendRequests] = useState([]);
  const [hovered, setHovered] = useState<HoverState>({ 
    sidebar: false, 
    profile: false, 
    watchlists: false, 
    friends: false 
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);

  const { userProfile, friendsProfiles, friendRequests } = useCachedProfileData();
  const { data: watchlistData, isLoading: isWatchlistsLoading, error: watchlistsError } = useWatchlists(clerkUser?.id);
  const { watchlists, ownerships, ownerIds } = watchlistData || {};
  const { data: sharedUsersData, error: sharedUsersError } = useSharedUsers(ownerIds);

  const sendFriendRequest = async (receiverId: string, receiverUsername: string) => {
    try {
      const token = await session?.getToken();
      const response = await fetch('/api/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          senderId: clerkUser?.id, 
          senderUsername: clerkUser?.username, 
          receiverId, 
          receiverUsername 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to send friend request');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const token = await session?.getToken();
      const response = await fetch('/api/friend-request/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      
      if (!response.ok) throw new Error('Failed to accept friend request');
      
      setFriendRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const token = await session?.getToken();
      const response = await fetch('/api/friend-request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
      
      if (!response.ok) throw new Error('Failed to reject friend request');
      
      setFriendRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const token = await session?.getToken();
      const response = await fetch(`/api/search?query=${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to search users');
      
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    }
  };

  if (!isUserLoaded || !session || !clerkUser || !userProfile || isWatchlistsLoading || supabaseLoading) {
    return <div>Loading...</div>;
  }

  if (watchlistsError) {
    console.error('Error fetching watchlists:', watchlistsError);
    return <div>Error loading watchlists</div>;
  }

  if (sharedUsersError) {
    console.error('Error fetching shared users:', sharedUsersError);
    return <div>Error loading user data</div>;
  }

  const watchlistCount = watchlists?.length || 0;
  const mediaCount = watchlists?.reduce((count, list) => count + (list.media?.length || 0), 0) || 0;

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setHovered({ ...hovered, sidebar: false });
  };

  const toggleFriendsSidebar = () => {
    setFriendsSidebarOpen(!friendsSidebarOpen);
  };

  // Merge watchlists with sharedUsersData to get the owner names
  const watchlistsWithOwners = watchlists?.map(watchlist => {
    const ownership = ownerships?.find(own => own.watchlist_id === watchlist.id);
    const owner = sharedUsersData?.find(user => user.id === ownership?.user_id);
    return {
      ...watchlist,
      ownerName: owner ? owner.username : 'Unknown',
    };
  });

  const sidebarWidth = sidebarOpen ? '240px' : '0';
  const friendSidebarWidth = friendsSidebarOpen ? '240px' : '0';

  return (
    <div className="w-screen h-screen flex flex-col bg-[#232323]">
      <nav 
        className="bg-[#121212] p-2 flex justify-between transition-all duration-300 fixed top-24 left-0 w-full z-40 rounded-lg"
        style={{ marginLeft: sidebarWidth, marginRight: friendSidebarWidth }}
      >
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
        <div className="flex items-center space-x-4 fixed right-3">
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
        <LibrarySidebar 
          watchlists={watchlistsWithOwners} 
          username={username} 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />
        <div 
          className="flex-grow transition-all duration-300"
          style={{ marginLeft: sidebarWidth, marginRight: friendSidebarWidth }}
        >
          <div className="flex-grow w-full mx-auto p-4">
            <Suspense fallback={<div>Loading...</div>}>
              {activeTab === 'profile' && (
                <ProfileTab 
                  userProfile={userProfile} 
                  watchlistCount={watchlistCount} 
                  mediaCount={mediaCount} 
                />
              )}
              {activeTab === 'watchlists' && (
                <WatchlistPage 
                  isFriendSidebarOpen={friendsSidebarOpen} 
                  isLibrarySidebarOpen={sidebarOpen}
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
} 