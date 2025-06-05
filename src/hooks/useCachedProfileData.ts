import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../utils/auth';

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

    const fetchOrCreateProfile = async () => {
      try {
        // Debug logging for Clerk user data
        console.log('Clerk User Data:', {
          id: user.id,
          username: user.username,
          hasId: !!user.id,
          idType: typeof user.id,
          idLength: user.id?.length
        });

        // Try to fetch existing profile using the Clerk user ID as text
        console.log('Attempting to fetch profile with ID:', user.id);
        const { data: existingProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .single();

        // Log the raw response for debugging
        console.log('Raw Supabase Response:', {
          data: existingProfile,
          error: fetchError ? {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          } : null
        });

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            console.log('Profile not found, creating new profile');
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([{
                id: user.id,  // Use Clerk ID directly as text
                username: user.username || `user_${user.id.slice(0, 8)}`,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
              .select('id, username')
              .single();

            console.log('Profile creation result:', {
              hasNewProfile: !!newProfile,
              newProfile,
              error: insertError ? {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
              } : null
            });

            if (insertError) throw insertError;
            setUserProfile(newProfile);
          } else {
            throw fetchError;
          }
        } else {
          setUserProfile(existingProfile);
        }
      } catch (err) {
        console.error('Error in fetchOrCreateProfile:', {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(err instanceof Error ? err : new Error('Failed to fetch/create profile'));
      }
    };

    fetchOrCreateProfile();
  }, [user, supabase, supabaseLoading]);

  useEffect(() => {
    if (supabaseLoading || !supabase || !userProfile) {
      setIsLoading(true);
      return;
    }

    const fetchFriends = async () => {
      try {
        setIsLoading(true);
        // Fetch friends using the user_id (Clerk ID string)
        const { data: friends, error: friendsError } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', userProfile.id);

        if (friendsError) {
          console.error('Error in fetchFriends:', friendsError);
          throw friendsError;
        }

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
        console.error('Error in fetchFriends:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [userProfile, supabase, supabaseLoading]);

  return {
    userProfile,
    friendsProfiles,
    isLoading: isLoading || supabaseLoading,
    error
  };
}

// TEST: Debug function to check friends query by user_id
export async function testFriendsQuery(supabase: any) {
  const testUserId = 'user_2y3chLAkikqxoBkKkfZXEnMbesG';
  const { data, error } = await supabase
    .from('friends')
    .select('*')
    .eq('user_id', testUserId);
  console.log('TEST friends query result:', { data, error });
}

export function clearCachedProfileData(setUserProfile: any, setFriendsProfiles: any, setIsLoading: any, setError: any) {
  setUserProfile(null);
  setFriendsProfiles([]);
  setIsLoading(true);
  setError(null);
} 