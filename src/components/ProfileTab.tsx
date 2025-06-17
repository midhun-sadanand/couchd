import React, { useState, useEffect } from 'react';
import MediaFeed from './MediaFeed';
import { useUser } from '@/utils/auth';
import ProfileSearchBar from './ProfileSearchBar';
import { MediaItem } from '@/types';
import { useSupabase } from '@/utils/auth';

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
  const isCurrentUser = currentUser?.id === userProfile.id;
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [recentItems, setRecentItems] = useState<MediaItem[]>([]);
  const [userWatchlistIds, setUserWatchlistIds] = useState<string[]>([]);
  const supabase = useSupabase().client;
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);

  // Fetch all watchlist IDs for the user
  useEffect(() => {
    const fetchWatchlists = async () => {
      const { data: watchlists, error } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', userProfile.id);
      if (!error && watchlists) {
        setUserWatchlistIds(watchlists.map((w: any) => w.id));
      } else {
        setUserWatchlistIds([]);
      }
    };
    fetchWatchlists();
  }, [userProfile.id, supabase]);

  // Fetch recent media items for those watchlists
  useEffect(() => {
    if (userWatchlistIds.length === 0) {
      setRecentItems([]);
      return;
    }
    const fetchRecent = async () => {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .in('watchlist_id', userWatchlistIds)
        .order('created_at', { ascending: false })
        .limit(6);
      if (!error && data) setRecentItems(data);
      else setRecentItems([]);
    };
    fetchRecent();
  }, [userWatchlistIds, supabase]);

  // Search handler with debounce
  const handleSearchInput = (val: string) => {
    setSearchInput(val);
    setSelectedMedia(null);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    if (!val.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setDebounceTimeout(setTimeout(() => searchMedia(val), 200));
  };

  // Search function
  const searchMedia = async (query: string) => {
    if (userWatchlistIds.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .in('watchlist_id', userWatchlistIds)
        .or([
          `title.ilike.%${query}%`,
          `creator.ilike.%${query}%`,
          `medium.ilike.%${query}%`,
          `synopsis.ilike.%${query}%`
        ].join(','))
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Just use the value from the database, fallback to default if falsy
  const avatarUrl = userProfile.avatar_url || DEFAULT_AVATAR;

  return (
    <div className="p-4 w-full mx-auto">
      <div className="flex flex-row items-start mb-4 gap-4 w-full justify-between">
        <div className="flex items-center flex-shrink min-w-0">
          <div
            className={`relative group ${isCurrentUser ? 'cursor-pointer' : ''}`}
            onClick={isCurrentUser ? onEditProfile : undefined}
          >
            <img
              src={avatarUrl}
              alt={userProfile.username}
              className="w-14 h-14 md:w-20 md:h-20 object-cover rounded-full mr-4 transition-all duration-200"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }
              }}
            />
            {isCurrentUser && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity mr-4">
                <span className="text-white text-xs md:text-sm">Edit Profile</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-2xl md:text-3xl text-left text-[#e6e6e6] font-bold transition-all duration-200">
              {userProfile.username}
            </h2>
            {userProfile.bio && (
              <p className="text-gray-400 mt-2 text-left text-xs md:text-base transition-all duration-200">{userProfile.bio}</p>
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
        <div className=" justify-end mt-5 min-w-0" style={{maxWidth: '350px'}}>
          <ProfileSearchBar
            value={searchInput}
            onChange={handleSearchInput}
            results={searchInput.trim() ? searchResults : recentItems}
            onSelect={item => { 
              setSelectedMedia(item);
              setTimeout(() => setSearchInput(''), 100); // Clear input after selection
            }}
            isLoading={isSearching}
            showRecentOnFocus={true}
          />
        </div>
      </div>
      <div className="w-full">
        <MediaFeed userId={userProfile.id} selectedMedia={selectedMedia} setSelectedMedia={setSelectedMedia} username={userProfile.username} />
      </div>
    </div>
  );
};

export default ProfileTab; 