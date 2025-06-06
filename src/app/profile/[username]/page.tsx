"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { useCachedProfileData } from '@/hooks/useCachedProfileData';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useSharedUsers } from '@/hooks/useSharedUsers';
import RecentActivity from '@/components/ActivityTab';
import LibrarySidebar from '@/components/LibrarySidebar';
import FriendSidebar from '@/components/FriendSidebar';
import ProfileTab from '@/components/ProfileTab';
import { Grid, Users, User, Sidebar } from '@geist-ui/icons';
import WatchlistPage from '@/app/watchlist/[watchlistId]/page';

interface User {
  id: string;
  username: string;
  imageUrl?: string;
  avatar_url: string | null;
}

interface Watchlist {
  id: string;
  name: string;
  description: string;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
  image: string | null;
  media?: any[];
  to_consume_count?: number;
  consuming_count?: number;
  consumed_count?: number;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
}

interface CachedProfileData {
  userProfile: User;
  friendsProfiles: User[];
  friendRequests: FriendRequest[];
}

interface WatchlistWithOwner {
  id: string;
  name: string;
  image?: string;
  ownerName: string;
}

interface SharedUser {
  id: string;
  username: string;
  imageUrl?: string;
}

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

const ProfilePage = () => {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  const { user: supabaseUser, loading: isUserLoading } = useUser();

  const { userProfile, friendsProfiles, friendRequests } = useCachedProfileData() as unknown as CachedProfileData;
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequestsState, setFriendRequests] = useState<FriendRequest[]>([]);
  const [hovered, setHovered] = useState({ sidebar: false, profile: false, watchlists: false, friends: false });
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);

  const { data: watchlistData, isLoading: isWatchlistsLoading, error: watchlistsError } = useWatchlists(supabaseUser?.id);
  const { watchlists, ownerships, ownerIds } = watchlistData || {};
  const { sharedUsers: sharedUsersData, error: sharedUsersError } = useSharedUsers(ownerIds?.[0] || '');

  const sendFriendRequest = async (receiverId: string, receiverUsername: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          senderId: supabaseUser?.id, 
          senderUsername: supabaseUser?.user_metadata?.username, 
          receiverId, 
          receiverUsername 
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send friend request');
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/friend-request/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to accept friend request');
      }

      setFriendRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/friend-request/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject friend request');
      }

      setFriendRequests(prevRequests => prevRequests.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/search?query=${query}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    }
  };

  if (isUserLoading || !supabaseUser || !userProfile || isWatchlistsLoading) {
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
  const mediaCount = 0;

  const goToWatchlists = () => {
    router.push(`/profile/${userProfile.username}/lists`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setHovered({ ...hovered, sidebar: false });
  };

  const toggleFriendsSidebar = () => {
    setFriendsSidebarOpen(!friendsSidebarOpen);
  };

  // Merge watchlists with sharedUsersData to get the owner names
  const watchlistsWithOwners: WatchlistWithOwner[] = watchlists?.map(watchlist => {
    const ownership = ownerships?.find(own => own.watchlist_id === watchlist.id);
    const owner = sharedUsersData?.find((user: SharedUser) => user.id === ownership?.user_id);
    return {
      id: watchlist.id,
      name: watchlist.name,
      image: watchlist.image || undefined,
      ownerName: owner ? owner.username : 'Unknown',
    };
  }) || [];

  const sidebarWidth = sidebarOpen ? '240px' : '0';
  const friendSidebarWidth = friendsSidebarOpen ? '240px' : '0';

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
        <div className={`flex-grow transition-all duration-300`} style={{ marginLeft: sidebarWidth, marginRight: friendSidebarWidth }}>
          <div className="flex-grow w-full mx-auto p-4">
            {activeTab === 'profile' && <ProfileTab userProfile={userProfile} watchlistCount={watchlistCount} mediaCount={mediaCount} />}
            {activeTab === 'watchlists' && (
              <WatchlistPage 
                isFriendSidebarOpen={friendsSidebarOpen} 
                isLibrarySidebarOpen={sidebarOpen}
              />
            )}
          </div>
        </div>
        <FriendSidebar
          friendsProfiles={friendsProfiles.map(friend => ({
            id: friend.id,
            username: friend.username,
            avatar_url: friend.avatar_url || null
          }))}
          friendRequests={friendRequests}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
          handleSearch={handleSearch}
          searchResults={searchResults}
          closeSidebar={toggleFriendsSidebar}
          sidebarOpen={friendsSidebarOpen}
          userId={supabaseUser?.id || ''}
        />
      </div>
    </div>
  );
};

export default ProfilePage; 