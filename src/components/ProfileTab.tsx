import React, { useState, useEffect, useContext } from 'react';
import MediaFeed from './MediaFeed';
import { useUser } from '@/utils/auth';
import ProfileSearchBar from './ProfileSearchBar';
import { MediaItem } from '@/types';
import { useSupabase } from '@/utils/auth';
import { useSearchParams } from 'next/navigation';
import { ProfileUIContext } from './Layout';

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
  const [recentItems, setRecentItems] = useState<MediaItem[]>([]);
  const [userWatchlistIds, setUserWatchlistIds] = useState<string[]>([]);
  const supabase = useSupabase().client;
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const searchParams = useSearchParams();
  const { setActiveTab, selectedMedia, setSelectedMedia } = useContext(ProfileUIContext);

  // Handle URL parameters
  useEffect(() => {
    const mediaId = searchParams.get('mediaId');
    const tab = searchParams.get('tab');
    
    // Set the active tab if specified
    if (tab === 'profile') {
      setActiveTab('profile');
    }

    // Fetch and set the media item if specified
    if (mediaId && userWatchlistIds.length > 0) {
      const fetchMediaItem = async () => {
        const { data, error } = await supabase
          .from('media_items')
          .select('*')
          .eq('id', mediaId)
          .single();
        if (!error && data) {
          setSelectedMedia(data);
        }
      };
      fetchMediaItem();
    }
  }, [searchParams, userWatchlistIds, supabase, setActiveTab, setSelectedMedia]);

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
    <div className="p-2 sm:p-4 w-full mx-auto">
      <div className="flex flex-col sm:flex-row items-start mb-4 gap-3 sm:gap-4 w-full">
        {/* Profile Info Section */}
        <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
          <div
            className={`relative group flex-shrink-0 ${isCurrentUser ? 'cursor-pointer' : ''}`}
            onClick={isCurrentUser ? onEditProfile : undefined}
          >
            <img
              src={avatarUrl}
              alt={userProfile.username}
              className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-cover rounded-full transition-all duration-200"
              onError={(e) => {
                if (!e.currentTarget.src.endsWith(DEFAULT_AVATAR)) {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }
              }}
            />
            {isCurrentUser && (
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                <span className="text-white text-[10px] sm:text-xs">Edit</span>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg sm:text-xl lg:text-2xl xl:text-3xl text-left text-[#e6e6e6] font-eina-bold transition-all duration-200">
              {userProfile.username}
            </h2>
            {userProfile.bio && (
              <p className="text-gray-400 mt-1 text-left text-xs sm:text-sm lg:text-base transition-all duration-200 line-clamp-2 font-eina">{userProfile.bio}</p>
            )}
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 mt-2">
              <div className="whitespace-nowrap">
                <span className="text-base sm:text-lg lg:text-xl text-[#e6e6e6] font-eina-bold">
                  {watchlistCount}
                </span>
                <span className="text-xs sm:text-sm text-gray-400 ml-1 font-eina hidden sm:inline">Watchlists</span>
                <span className="text-xs sm:text-sm text-gray-400 ml-1 font-eina sm:hidden">Lists</span>
              </div>
              <div className="whitespace-nowrap">
                <span className="text-base sm:text-lg lg:text-xl text-[#e6e6e6] font-eina-bold">
                  {mediaCount}
                </span>
                <span className="text-xs sm:text-sm text-gray-400 ml-1 font-eina hidden lg:inline">Media Consumed</span>
                <span className="text-xs sm:text-sm text-gray-400 ml-1 font-eina lg:hidden">Media</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search Bar Section - Aligned to the right */}
        <div className="w-full sm:w-auto sm:flex-shrink-0 sm:ml-auto sm:mt-3" style={{maxWidth: '100%'}}>
          <div className="sm:min-w-[250px] sm:max-w-[350px]">
            <ProfileSearchBar
              value={searchInput}
              onChange={handleSearchInput}
              results={searchInput.trim() ? searchResults : recentItems}
              onSelect={item => { 
                setSelectedMedia(item);
                setTimeout(() => setSearchInput(''), 100);
              }}
              isLoading={isSearching}
              showRecentOnFocus={true}
            />
          </div>
        </div>
      </div>
      <div className="w-full">
        <MediaFeed userId={userProfile.id} selectedMedia={selectedMedia} setSelectedMedia={setSelectedMedia} username={userProfile.username} />
      </div>
    </div>
  );
};

export default ProfileTab; 