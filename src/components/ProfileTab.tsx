import React, { useState, useEffect } from 'react';
import ActivityTab from './ActivityTab';
import { useUser, useSupabaseClient } from '@/utils/auth';

interface UserProfile {
  id: string;
  username: string;
  imageUrl?: string;
  avatar_url: string | null;
  bio?: string;
}

interface ProfileTabProps {
  userProfile: UserProfile;
  watchlistCount: number;
  mediaCount: number;
  onEditProfile: () => void;
}

const DEFAULT_AVATAR = '/default_pfp.png';

const ProfileTab: React.FC<ProfileTabProps> = ({ 
  userProfile, 
  watchlistCount, 
  mediaCount,
  onEditProfile
}) => {
  const { user: currentUser } = useUser();
  const supabase = useSupabaseClient();
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR);
  const isCurrentUser = currentUser?.id === userProfile.id;

  useEffect(() => {
    const fetchAvatarUrl = async () => {
      if (!userProfile.avatar_url || userProfile.avatar_url.trim() === '') {
        setAvatarUrl(DEFAULT_AVATAR);
        return;
      }
      try {
        // Check if it's a storage path or a full URL
        if (userProfile.avatar_url.startsWith('http')) {
          setAvatarUrl(userProfile.avatar_url);
        } else {
          const { data: { signedUrl }, error: urlError } = await supabase.storage
            .from('images')
            .createSignedUrl(userProfile.avatar_url, 31536000);
          if (!urlError && signedUrl) {
            setAvatarUrl(signedUrl);
          } else {
            setAvatarUrl(DEFAULT_AVATAR);
          }
        }
      } catch (error) {
        setAvatarUrl(DEFAULT_AVATAR);
      }
    };
    fetchAvatarUrl();
  }, [userProfile.avatar_url, supabase]);

  return (
    <div className="p-4 w-9/10 mx-auto">
      <div className="flex items-center mb-4">
        <div 
          className={`relative group ${isCurrentUser ? 'cursor-pointer' : ''}`}
          onClick={isCurrentUser ? onEditProfile : undefined}
        >
          <img
            src={avatarUrl}
            alt={userProfile.username}
            className="w-20 h-20 object-cover rounded-full mr-4"
            onError={() => setAvatarUrl(DEFAULT_AVATAR)}
          />
          {isCurrentUser && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity mr-4">
              <span className="text-white text-sm">Edit Profile</span>
            </div>
          )}
        </div>
        <div>
          <h2 className="text-3xl text-left text-[#e6e6e6] font-bold">
            {userProfile.username}
          </h2>
          {userProfile.bio && (
            <p className="text-gray-400 mt-2 text-left">{userProfile.bio}</p>
          )}
          <div className="flex space-x-4 mt-2">
            <div>
              <span className="text-xl text-[#e6e6e6] font-bold">
                {watchlistCount}
              </span>
              <span className="text-sm text-gray-400 ml-1">Watchlists</span>
            </div>
            <div>
              <span className="text-xl text-[#e6e6e6] font-bold">
                {mediaCount}
              </span>
              <span className="text-sm text-gray-400 ml-1">Media Consumed</span>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full">
        <ActivityTab username={userProfile.username} />
      </div>
    </div>
  );
};

export default ProfileTab; 