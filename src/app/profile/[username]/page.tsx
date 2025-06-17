"use client";

import React, { useState, useEffect, useContext } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser, useSupabaseClient } from '@/utils/auth';
import { useCachedProfileData } from '@/hooks/useCachedProfileData';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useSharedUsers } from '@/hooks/useSharedUsers';
import RecentActivity from '@/components/ActivityTab';
import LibrarySidebar from '@/components/LibrarySidebar';
import FriendSidebar from '@/components/FriendSidebar';
import ProfileTab from '@/components/ProfileTab';
import { Grid, Users, User, Sidebar } from '@geist-ui/icons';
import WatchlistList from '@/components/WatchlistList';
import EditProfileModal from '@/components/EditProfileModal';
import { ProfileUIContext } from '@/components/Layout';

interface User {
  id: string;
  username: string;
  imageUrl?: string;
  avatar_url: string | null;
  bio?: string;
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
  refetchProfile: () => Promise<void>;
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
  const supabase = useSupabaseClient();

  // Use context for sidebar/tab state
  const {
    sidebarOpen,
    setSidebarOpen,
    friendsSidebarOpen,
    setFriendsSidebarOpen,
    activeTab,
    setActiveTab,
  } = useContext(ProfileUIContext);

  const { userProfile, friendsProfiles, friendRequests, refetchProfile } = useCachedProfileData() as unknown as CachedProfileData;
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequestsState, setFriendRequests] = useState<FriendRequest[]>([]);
  const [hovered, setHovered] = useState({ sidebar: false, profile: false, watchlists: false, friends: false });
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png');
  const [bio, setBio] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [modalProfile, setModalProfile] = useState({ avatar_url: '', bio: '', username: '' });

  const { data: watchlistData, isLoading: isWatchlistsLoading, error: watchlistsError } = useWatchlists(supabaseUser?.id);
  const { watchlists, ownerships, ownerIds } = watchlistData || {};
  const { sharedUsers: sharedUsersData, error: sharedUsersError } = useSharedUsers(ownerIds?.[0] || '');

  // Log userProfile.avatar_url whenever it changes
  useEffect(() => {
    console.log('Main profile page userProfile.avatar_url:', userProfile?.avatar_url);
  }, [userProfile?.avatar_url]);

  const handleProfileSave = async (avatarFile: File | null, newBio: string, newUsername: string) => {
    try {
      let newAvatarUrl = userProfile.avatar_url;
      let storagePath = userProfile.avatar_url; // Keep existing path if no new file

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        storagePath = `${userProfile.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage.from('images').upload(storagePath, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        
        const { data: { signedUrl }, error: urlError } = await supabase.storage
          .from('images')
          .createSignedUrl(storagePath, 31536000);
        
        if (urlError) throw urlError;
        newAvatarUrl = signedUrl;
      }

      // Update the profile in the database with the signed URL (not the storage path)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: newAvatarUrl, // Store the signed URL
          bio: newBio,
          username: newUsername 
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Use the refetchProfile function to update the main profile page
      await refetchProfile();
      // Wait a tick to ensure the new userProfile is available before closing the modal
      setTimeout(() => setEditModalOpen(false), 100);

      // Only refresh the page if username changed
      if (newUsername !== userProfile.username) {
        router.push(`/profile/${newUsername}`);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
    }
  };

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

  // Update the onEditProfile handler to fetch latest data before opening modal
  const openEditModal = async () => {
    if (userProfile) {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, bio, username')
        .eq('id', userProfile.id)
        .single();
      if (!error && data) {
        setModalProfile({
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          username: data.username || '',
        });
        setEditModalOpen(true);
      }
    }
  };

  // Debug log for loading state
  console.log({ isUserLoading, supabaseUser, userProfile, isWatchlistsLoading });
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

  return (
    <div className="w-screen h-screen flex flex-col bg-[#232323]">
      <div className="flex-grow flex mt-8">
        <LibrarySidebar 
          watchlists={watchlistsWithOwners} 
          username={userProfile.username} 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <div className={`flex-grow transition-all duration-300`} style={{ marginLeft: sidebarOpen ? '80px' : '0', marginRight: friendsSidebarOpen ? '240px' : '0' }}>
          <div className="flex-grow w-full mx-auto p-4">
            {activeTab === 'profile' && (
              <ProfileTab 
                userProfile={userProfile} 
                watchlistCount={watchlistCount} 
                mediaCount={mediaCount} 
                onEditProfile={openEditModal}
              />
            )}
            {activeTab === 'watchlists' && (
              <WatchlistList 
                isFriendSidebarOpen={friendsSidebarOpen} 
                isLibrarySidebarOpen={sidebarOpen}
                userId={supabaseUser?.id}
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
          closeSidebar={() => setFriendsSidebarOpen(!friendsSidebarOpen)}
          sidebarOpen={friendsSidebarOpen}
          userId={supabaseUser?.id || ''}
        />
      </div>
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleProfileSave}
        initialAvatarUrl={modalProfile.avatar_url}
        initialBio={modalProfile.bio}
        initialUsername={modalProfile.username}
      />
    </div>
  );
};

export default ProfilePage; 