import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser, useSupabaseClient } from '@/utils/auth';

interface User {
  id: string;
  username: string;
  avatar_url?: string | null;
  bio?: string;
}

// Hook to fetch/create user profile
export function useUserProfile() {
  const { user } = useUser();
  const supabase = useSupabaseClient();

  return useQuery<User | null, Error>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user || !supabase) return null;

      // Try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create it
          const { data: newProfile, error: insertError} = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              username: user.username || `user_${user.id.slice(0, 8)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select('id, username, avatar_url, bio')
            .single();

          if (insertError) throw insertError;
          return newProfile;
        } else {
          throw fetchError;
        }
      }

      return existingProfile;
    },
    enabled: !!user && !!supabase,
    staleTime: 30 * 60 * 1000, // 30 minutes - profiles rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnMount: false,
    refetchOnWindowFocus: false, // Profiles don't change often
  });
}

// Hook to fetch user's friends
export function useFriendsProfiles(userId: string | undefined) {
  const supabase = useSupabaseClient();

  return useQuery<User[], Error>({
    queryKey: ['friendsProfiles', userId],
    queryFn: async () => {
      if (!userId || !supabase) return [];

      // Fetch friend IDs
      const { data: friends, error: friendsError } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId);

      if (friendsError) throw friendsError;

      if (!friends || friends.length === 0) return [];

      // Fetch friend profiles
      const friendIds = friends.map(f => f.friend_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .in('id', friendIds);

      if (profilesError) throw profilesError;
      return profiles || [];
    },
    enabled: !!userId && !!supabase,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: true,
  });
}

// Combined hook for backward compatibility
export function useCachedProfileData() {
  const { user } = useUser();
  const profileQuery = useUserProfile();
  const friendsQuery = useFriendsProfiles(user?.id);
  const queryClient = useQueryClient();

  const refetchProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['userProfile', user?.id] });
    await queryClient.refetchQueries({ queryKey: ['userProfile', user?.id] });
  };

  return {
    userProfile: profileQuery.data || null,
    friendsProfiles: friendsQuery.data || [],
    isLoading: profileQuery.isLoading || friendsQuery.isLoading,
    error: profileQuery.error || friendsQuery.error,
    refetchProfile,
  };
}

// Helper to invalidate profile cache
export function useInvalidateProfile() {
  const queryClient = useQueryClient();
  return (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['friendsProfiles', userId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['friendsProfiles'] });
    }
  };
}
