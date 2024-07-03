import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import supabase from '../utils/supabaseClient';
import { useUser } from '@clerk/clerk-react';

const fetchUserProfile = async ({ queryKey }) => {
  const userId = queryKey[1];
  if (!userId) throw new Error('User ID is required');

  // Here you can fetch the user profile from your backend if needed
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

export const useCachedProfileData = () => {
  const queryClient = useQueryClient();
  const { user: clerkUser, isLoaded } = useUser();
  const [cachedUser, setCachedUser] = useState(null);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setCachedUser(clerkUser);
      queryClient.setQueryData(['userProfile', clerkUser.id], clerkUser);

      queryClient.prefetchQuery({
        queryKey: ['friendsUserIds', clerkUser.id],
        queryFn: fetchFriendsUserIds,
      });
    }
  }, [clerkUser, isLoaded, queryClient]);

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

  return {
    userProfile: userProfileQuery.data,
    friendsProfiles: friendsProfilesQuery.data,
  };
};
