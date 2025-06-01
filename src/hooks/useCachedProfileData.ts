import { useState, useEffect, useContext } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase, SupabaseContext } from '../utils/auth';

interface User {
  id: string;
  username: string;
  // Add other user properties as needed
}

interface CachedProfileData {
  userProfile: User | null;
  friendsProfiles: User[];
  isLoading: boolean;
  error: Error | null;
}

export function useCachedProfileData(): CachedProfileData {
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [friendsProfiles, setFriendsProfiles] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useUser();
  const { client: supabase, isLoading: supabaseLoading } = useSupabase();

  useEffect(() => {
    if (!user || supabaseLoading || !supabase) {
      setUserProfile(null);
      return;
    }
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single();
      if (!error && data) setUserProfile(data);
      else setUserProfile(null);
    };
    fetchProfile();
  }, [user, supabase, supabaseLoading]);

  useEffect(() => {
    if (supabaseLoading || !supabase) {
      setIsLoading(true);
      return;
    }

    const fetchFriends = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const { data: friends, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', user.id);
        if (friendsError) throw friendsError;
        if (friends && friends.length > 0) {
          const friendIds = friends.map(f => f.friend_id);
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', friendIds);
          if (profilesError) throw profilesError;
          setFriendsProfiles(profiles || []);
        } else {
          setFriendsProfiles([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [user, supabase, supabaseLoading]);

  return { userProfile, friendsProfiles, isLoading: isLoading || supabaseLoading, error };
} 