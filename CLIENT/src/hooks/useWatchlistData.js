import { useQuery, useQueryClient } from '@tanstack/react-query';
import supabase from '../utils/supabaseClient';

const fetchWatchlistData = async ({ queryKey }) => {
  const watchlistId = queryKey[1];

  // Fetch the watchlist data
  const { data: watchlist, error: watchlistError } = await supabase
    .from('watchlists')
    .select('id, name, is_public, image, description, shared_with')
    .eq('id', watchlistId)
    .single();

  if (watchlistError) {
    throw watchlistError;
  }

  // Fetch the watchlist owner's user ID from the watchlist_ownership table
  const { data: ownerData, error: ownerError } = await supabase
    .from('watchlist_ownership')
    .select('user_id')
    .eq('watchlist_id', watchlistId)
    .single();

  if (ownerError) {
    throw ownerError;
  }

  // Combine ownerId with shared users
  const userIdsToFetch = [ownerData.user_id, ...watchlist.shared_with];

  // Fetch both owner and shared users profiles using Clerk
  const profilesResponse = await fetch('http://localhost:3001/api/get-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userIds: userIdsToFetch }),
  });

  if (!profilesResponse.ok) {
    throw new Error('Failed to fetch users');
  }

  const profiles = await profilesResponse.json();

  // Separate owner profile from shared users
  const ownerProfile = profiles.find(profile => profile.id === ownerData.user_id);
  const sharedUserProfiles = profiles.filter(profile => watchlist.shared_with.includes(profile.id));

  return { ...watchlist, ownerProfile, sharedUserProfiles };
};

export const useWatchlistData = (watchlistId) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['watchlistData', watchlistId],
    queryFn: fetchWatchlistData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onSuccess: async (watchlist) => {
      const { ownerProfile, sharedUserProfiles } = watchlist;

      // Prefetch owner profile
      queryClient.setQueryData(['sharedUsers', [ownerProfile.id]], ownerProfile);

      // Prefetch shared users profiles
      sharedUserProfiles.forEach(userProfile => {
        queryClient.setQueryData(['sharedUsers', [userProfile.id]], userProfile);
      });
    },
  });
};
