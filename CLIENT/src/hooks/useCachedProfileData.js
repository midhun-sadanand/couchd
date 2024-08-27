import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';
import { useUser, useSession } from '@clerk/clerk-react';

const fetchUserProfile = async ({ queryKey }) => {
  const userId = queryKey[1];
  if (!userId) throw new Error('User ID is required');
  return { id: userId, imageUrl: 'defaultImageUrl', username: 'defaultUsername' };
};

const fetchFriendsUserIds = async ({ queryKey }) => {
  const userId = queryKey[1];
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('friends')
    .select('friends')
    .eq('profile_id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data ? data.friends : [];
};

const fetchFriendsProfiles = async ({ queryKey }) => {
  const friendIds = queryKey[1];
  if (!Array.isArray(friendIds) || friendIds.length === 0) return [];

  const response = await fetch('http://localhost:3001/api/get-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds: friendIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch friends profiles');
  }

  const friendsProfiles = await response.json();
  return friendsProfiles;
};

const fetchFriendRequests = async ({ queryKey, token }) => {
  const receiverId = queryKey[1];
  if (!receiverId) throw new Error('Receiver ID is required');

  const response = await fetch(`http://localhost:3001/api/friend-requests?receiverId=${receiverId}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Add Clerk token to the header
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch friend requests');
  }

  const friendRequests = await response.json();
  return friendRequests;
};

export const useCachedProfileData = () => {
  const queryClient = useQueryClient();
  const { user: clerkUser, isLoaded } = useUser();
  const { session } = useSession(); // Get session from Clerk
  const [token, setToken] = useState(null);
  const [cachedUser, setCachedUser] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (session) {
        const fetchedToken = await session.getToken();
        setToken(fetchedToken);
      }
    };
    fetchToken();
  }, [session]);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setCachedUser(clerkUser);
      queryClient.setQueryData(['userProfile', clerkUser.id], clerkUser);

      queryClient.prefetchQuery({
        queryKey: ['friendsUserIds', clerkUser.id],
        queryFn: fetchFriendsUserIds,
      });

      if (token) {
        queryClient.prefetchQuery({
          queryKey: ['friendRequests', clerkUser.id],
          queryFn: () => fetchFriendRequests({ queryKey: ['friendRequests', clerkUser.id], token }),
        });
      }
    }
  }, [clerkUser, isLoaded, queryClient, token]);

  const userProfileQuery = useQuery({
    queryKey: ['userProfile', clerkUser?.id],
    queryFn: fetchUserProfile,
    initialData: cachedUser,
    enabled: isLoaded && !!clerkUser?.id,
  });

  const friendsUserIdsQuery = useQuery({
    queryKey: ['friendsUserIds', clerkUser?.id],
    queryFn: fetchFriendsUserIds,
    enabled: isLoaded && !!clerkUser?.id,
  });

  const friendsProfilesQuery = useQuery({
    queryKey: ['friendsProfiles', friendsUserIdsQuery.data || []],
    queryFn: fetchFriendsProfiles,
    enabled: friendsUserIdsQuery.isSuccess && friendsUserIdsQuery.data.length > 0,
  });

  const friendRequestsQuery = useQuery({
    queryKey: ['friendRequests', clerkUser?.id],
    queryFn: () => fetchFriendRequests({ queryKey: ['friendRequests', clerkUser?.id], token }),
    enabled: isLoaded && !!clerkUser?.id && !!token,
  });

  return {
    userProfile: userProfileQuery.data,
    friendsProfiles: friendsProfilesQuery.data,
    friendRequests: friendRequestsQuery.data,
  };
};
