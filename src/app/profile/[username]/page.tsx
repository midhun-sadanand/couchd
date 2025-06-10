"use client";

import React, { useState, useEffect } from 'react';
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

  const { userProfile, friendsProfiles, friendRequests } = useCachedProfileData() as unknown as CachedProfileData;
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequestsState, setFriendRequests] = useState<FriendRequest[]>([]);
  const [hovered, setHovered] = useState({ sidebar: false, profile: false, watchlists: false, friends: false });
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png');
  const [bio, setBio] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentUsername, setCurrentUsername] = useState('');

  const { data: watchlistData, isLoading: isWatchlistsLoading, error: watchlistsError } = useWatchlists(supabaseUser?.id);
  const { watchlists, ownerships, ownerIds } = watchlistData || {};
  const { sharedUsers: sharedUsersData, error: sharedUsersError } = useSharedUsers(ownerIds?.[0] || '');

  // Set avatarUrl, bio, and username when userProfile is available
  useEffect(() => {
    const fetchProfileData = async () => {
      if (userProfile) {
        console.log('Full User Profile:', JSON.stringify(userProfile, null, 2));
        console.log('Avatar URL type:', typeof userProfile.avatar_url);
        console.log('Avatar URL value:', userProfile.avatar_url);
        
        let newAvatarUrl = '/default-avatar.png';
        if (userProfile.avatar_url) {
          try {
            // Check if it's a storage path or a full URL
            if (userProfile.avatar_url.startsWith('http')) {
              console.log('Using full URL directly');
              newAvatarUrl = userProfile.avatar_url;
            } else {
              console.log('Creating signed URL for storage path');
              const { data: { signedUrl }, error: urlError } = await supabase.storage
                .from('images')
                .createSignedUrl(userProfile.avatar_url, 31536000);
              
              console.log('Signed URL response:', { signedUrl, urlError });
              if (!urlError && signedUrl) {
                newAvatarUrl = signedUrl;
              }
            }
          } catch (error) {
            console.error('Error handling avatar URL:', error);
          }
        } else {
          console.log('No avatar_url in userProfile');
        }
        console.log('Final avatar URL being set:', newAvatarUrl);
        setAvatarUrl(newAvatarUrl);
        setBio(userProfile.bio || '');
        setCurrentUsername(userProfile.username || '');
      }
    };
    fetchProfileData();
  }, [userProfile, supabase]);

  // Fetch latest profile data when modal opens
  useEffect(() => {
    const fetchProfile = async () => {
      if (editModalOpen && userProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, bio, username')
          .eq('id', userProfile.id)
          .single();
        if (!error && data) {
          let newAvatarUrl = '/default-avatar.png';
          if (data.avatar_url) {
            const filePath = data.avatar_url.split('/').pop()?.split('?')[0];
            if (filePath) {
              const { data: { signedUrl }, error: urlError } = await supabase.storage
                .from('images')
                .createSignedUrl(filePath, 31536000); // 1 year expiry
              
              if (!urlError && signedUrl) {
                newAvatarUrl = signedUrl;
              }
            }
          }
          setAvatarUrl(newAvatarUrl);
          setBio(data.bio || '');
          setCurrentUsername(data.username || '');
        }
      }
    };
    fetchProfile();
  }, [editModalOpen, userProfile?.id, supabase]);

  const handleProfileSave = async (avatarFile: File | null, newBio: string, newUsername: string) => {
    try {
      let newAvatarUrl = avatarUrl;
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

      // Update the profile in the database with the storage path, not the signed URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: storagePath, // Store the storage path, not the signed URL
          bio: newBio,
          username: newUsername 
        })
        .eq('id', userProfile.id);

      if (updateError) throw updateError;

      // Update local state with the signed URL for display
      if (userProfile) {
        userProfile.avatar_url = storagePath; // Store the path in the userProfile
      }

      // Update component state with the signed URL for display
      setAvatarUrl(newAvatarUrl);
      setBio(newBio);
      setCurrentUsername(newUsername);
      setEditModalOpen(false);

      // Only refresh the page if username changed
      if (newUsername !== userProfile.username) {
        router.push(`/profile/${newUsername}`);
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
    }
  };

  // Add a function to refresh profile data
  const refreshProfileData = async () => {
    if (userProfile) {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, bio, username')
        .eq('id', userProfile.id)
        .single();
      if (!error && data) {
        const newAvatarUrl = data.avatar_url && data.avatar_url.trim() !== '' 
          ? data.avatar_url 
          : '/default-avatar.png';
        setAvatarUrl(newAvatarUrl);
        setBio(data.bio || '');
        setCurrentUsername(data.username || '');
      }
    }
  };

  // Refresh data when modal opens
  useEffect(() => {
    if (editModalOpen) {
      refreshProfileData();
    }
  }, [editModalOpen]);

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
          username={currentUsername} 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
        />
        <div className={`flex-grow transition-all duration-300`} style={{ marginLeft: sidebarWidth, marginRight: friendSidebarWidth }}>
          <div className="flex-grow w-full mx-auto p-4">
            {activeTab === 'profile' && (
              <ProfileTab 
                userProfile={userProfile} 
                watchlistCount={watchlistCount} 
                mediaCount={mediaCount} 
                onEditProfile={() => setEditModalOpen(true)}
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
          closeSidebar={toggleFriendsSidebar}
          sidebarOpen={friendsSidebarOpen}
          userId={supabaseUser?.id || ''}
        />
      </div>
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleProfileSave}
        initialAvatarUrl={avatarUrl}
        initialBio={bio}
        initialUsername={currentUsername}
      />
    </div>
  );
};

export default ProfilePage; 