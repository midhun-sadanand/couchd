'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { useSupabaseClient } from '@/utils/auth';
import WatchlistWidget from './WatchlistWidget';
import AddWatchlistModal from './AddWatchlistModal';
import { useWatchlists } from '@/hooks/useWatchlists';
import { Plus } from '@geist-ui/icons';
import { useQueryClient } from '@tanstack/react-query';
import ImageUploadModal from './ImageUploadModal';
import ShareWatchlist from './ShareWatchlist';
import WatchlistButton from './WatchlistButton';

interface WatchlistPageProps {
  isFriendSidebarOpen?: boolean;
  isLibrarySidebarOpen?: boolean;
}

interface Watchlist {
  id: string;
  name: string;
  description: string;
  tags: string[];
  to_consume_count: number;
  consuming_count: number;
  consumed_count: number;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  image: string | null;
}

interface TagOption {
  label: string;
  value: string;
}

interface User {
  id: string;
  username: string;
}

const WatchlistPage: React.FC<WatchlistPageProps> = ({ isFriendSidebarOpen = false, isLibrarySidebarOpen = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState<TagOption[]>([]);
  const [availableWidth, setAvailableWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [hovered, setHovered] = useState({ grid: false });
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { data: watchlistData, error } = useWatchlists(user?.id);
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);
  const [selectedTab, setSelectedTab] = useState<'created' | 'shared' | 'all'>('created');
  const [createdWatchlists, setCreatedWatchlists] = useState<Watchlist[]>([]);
  const [sharedWatchlists, setSharedWatchlists] = useState<Watchlist[]>([]);
  const [allWatchlists, setAllWatchlists] = useState<Watchlist[]>([]);

  const watchlists = watchlistData?.watchlists || [];

  // Auth redirect
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push('/login');
    }
  }, [user, isLoaded, router]);

  // Tag options
  useEffect(() => {
    if (watchlists.length > 0) {
      const allTags = new Set<string>();
      watchlists.forEach(watchlist => {
        (watchlist.tags || []).forEach((tag: string) => allTags.add(tag));
      });
      setOptions([...allTags].map(tag => ({ label: tag, value: tag })));
    }
  }, [watchlists]);

  // Responsive grid
  useEffect(() => {
    const updateAvailableWidth = () => {
      const librarySidebarWidth = isLibrarySidebarOpen ? 240 : 0;
      const friendSidebarWidth = isFriendSidebarOpen ? 320 : 0;
      setAvailableWidth(window.innerWidth - librarySidebarWidth - friendSidebarWidth);
    };
    updateAvailableWidth();
    window.addEventListener('resize', updateAvailableWidth);
    return () => window.removeEventListener('resize', updateAvailableWidth);
  }, [isFriendSidebarOpen, isLibrarySidebarOpen]);

  // Delete watchlist
  const deleteWatchlist = async (deletedId: string) => {
    if (window.confirm(`Are you sure you want to delete this list?`)) {
      try {
        const { error: watchlistError } = await supabase
          .from('watchlists')
          .delete()
          .match({ id: deletedId });
        if (watchlistError) throw watchlistError;
        // Optionally: delete from ownership/sharing tables if needed
        // Refetch or invalidate query here if using react-query
        window.location.reload(); // Quick fix for now
      } catch (error: any) {
        console.error('Error deleting list:', error.message);
      }
    }
  };

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user || !watchlistData?.watchlists[0].id) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('watchlists')
          .select('*')
          .eq('id', watchlistData.watchlists[0].id)
          .single();

        if (error) throw error;
        setWatchlist(data);

        // Fetch shared users
        const { data: sharedData, error: sharedError } = await supabase
          .from('shared_watchlists')
          .select('user_id, profiles:user_id (id, username)')
          .eq('watchlist_id', data.id);

        if (sharedError) throw sharedError;
        setSharedUsers(sharedData?.map(item => item.profiles) || []);
      } catch (err) {
        console.error('Error fetching watchlist:', err instanceof Error ? err : new Error('Failed to fetch watchlist'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, watchlistData?.watchlists[0].id, supabase]);

  const handleImageUpload = (imageUrl: string) => {
    if (watchlist) {
      setWatchlist({ ...watchlist, image: imageUrl });
    }
  };

  const handleClose = (description: string, isPublic: boolean, users: User[]) => {
    if (watchlist) {
      setWatchlist({ ...watchlist, description, is_public: isPublic });
    }
    setSharedUsers(users);
    setShowImageModal(false);
  };

  useEffect(() => {
    if (!user) return;
    const fetchWatchlists = async () => {
      try {
        console.log('Fetching watchlists for user:', user.id);
        
        // Created by you
        const { data: created, error: createdError } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', user.id);
        
        if (createdError) {
          console.error('Error fetching created watchlists:', createdError);
          throw createdError;
        }
        console.log('Created watchlists:', created);

        // Shared with you - using a more inclusive approach
        const { data: shared, error: sharedError } = await supabase
          .from('watchlist_sharing')
          .select(`
            watchlist_id,
            watchlists (
              *,
              profiles (
                username
              )
            )
          `)
          .eq('shared_with_user_id', user.id);

        if (sharedError) {
          console.error('Error fetching shared watchlists:', sharedError);
          throw sharedError;
        }
        console.log('Raw shared watchlists data:', shared);
        console.log('Number of shared watchlists found:', shared?.length || 0);

        // Also check watchlists where user is in shared_with array
        const { data: jsonShared, error: jsonSharedError } = await supabase
          .from('watchlists')
          .select(`
            *,
            profiles (
              username
            )
          `)
          .contains('shared_with', [user.id]);

        if (jsonSharedError) {
          console.error('Error fetching JSON shared watchlists:', jsonSharedError);
          throw jsonSharedError;
        }
        console.log('JSON shared watchlists:', jsonShared);
        console.log('Number of JSON shared watchlists found:', jsonShared?.length || 0);

        // Transform shared watchlists data
        const sharedWatchlists = [
          ...(shared || []).map((row: any) => {
            console.log('Processing shared watchlist row:', row);
            return {
              ...row.watchlists,
              ownerUsername: row.watchlists?.profiles?.username
            };
          }),
          ...(jsonShared || []).map((wl: any) => {
            console.log('Processing JSON shared watchlist:', wl);
            return {
              ...wl,
              ownerUsername: wl.profiles?.username
            };
          })
        ].filter(Boolean);
        
        console.log('Transformed shared watchlists:', sharedWatchlists);
        console.log('Number of transformed shared watchlists:', sharedWatchlists.length);

        // All (no duplicates)
        const all = [
          ...(created || []),
          ...sharedWatchlists.filter((wl: Watchlist) => 
            !(created || []).some((cw: Watchlist) => cw.id === wl.id)
          )
        ];
        console.log('All watchlists:', all);
        console.log('Number of all watchlists:', all.length);

        setCreatedWatchlists(created || []);
        setSharedWatchlists(sharedWatchlists);
        setAllWatchlists(all);
      } catch (err) {
        console.error('Error in fetchWatchlists:', err);
      }
    };
    fetchWatchlists();
  }, [user, supabase]);

  let displayedWatchlists: Watchlist[] = [];
  if (selectedTab === 'created') displayedWatchlists = createdWatchlists;
  else if (selectedTab === 'shared') displayedWatchlists = sharedWatchlists;
  else displayedWatchlists = allWatchlists;

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading watchlists</div>;
  }

  if (!isLoaded || !user) {
    return <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">Loading...</div>;
  }

  const calculateGridCols = (width: number) => {
    if (width >= 1200) return 4;
    if (width >= 960) return 3;
    if (width >= 720) return 2;
    return 1;
  };
  const gridCols = calculateGridCols(availableWidth);

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ padding: '0 16px' }}>
      <h1 className="text-6xl my-10 text-[#e6e6e6] font-bold text-center">
        Your Watchlists
      </h1>
      {/* Tab Selector - moved directly under heading */}
      <div className="flex space-x-4 mb-8 justify-center w-full">
        <button
          className={`px-4 py-2 rounded transition-colors duration-200 font-semibold text-lg ${selectedTab === 'created' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-[#444]'}`}
          onClick={() => setSelectedTab('created')}
        >
          Created by You
        </button>
        <button
          className={`px-4 py-2 rounded transition-colors duration-200 font-semibold text-lg ${selectedTab === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-[#444]'}`}
          onClick={() => setSelectedTab('shared')}
        >
          Shared with You
        </button>
        <button
          className={`px-4 py-2 rounded transition-colors duration-200 font-semibold text-lg ${selectedTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 border border-[#444]'}`}
          onClick={() => setSelectedTab('all')}
        >
          All
        </button>
      </div>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          width: '100%',
          maxWidth: '1200px',
          justifyContent: 'center',
          justifyItems: 'center',
        }}
      >
        {displayedWatchlists.map((list: Watchlist) => (
          <WatchlistWidget
            key={list.id}
            watchlistId={list.id}
            username={user.username || user.email || ''}
            listName={list.name}
            description={list.description}
            unwatchedCount={list.to_consume_count}
            watchingCount={list.consuming_count}
            watchedCount={list.consumed_count}
            tags={list.tags || []}
            deleteWatchlist={deleteWatchlist}
          />
        ))}
      </div>
      <div className="fixed bottom-8 right-8">
        <WatchlistButton
          onClick={() => setShowModal(true)}
          hovered={hovered}
          setHovered={setHovered}
        />
      </div>
      <AddWatchlistModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        options={options}
        setOptions={setOptions}
        watchlists={watchlists}
        user={user}
      />
      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center space-x-4">
          {watchlist?.image ? (
            <img
              src={watchlist.image}
              alt={watchlist.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-gray-600 rounded-lg" />
          )}
          <div>
            <h1 className="text-2xl font-bold">{watchlist?.name}</h1>
            <p className="text-gray-400">{watchlist?.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowImageModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit
          </button>
          <ShareWatchlist
            friends={[]}
            sharedUsers={sharedUsers}
            onShareToggle={() => {}}
            pendingShares={sharedUsers.map(user => user.id)}
          />
        </div>
      </div>
      {showImageModal && (
        <ImageUploadModal
          watchlistId={watchlist?.id || ''}
          onClose={handleClose}
          sharedUsers={sharedUsers}
          friends={[]}
          onImageUpload={handleImageUpload}
          watchlistName={watchlist?.name || ''}
          watchlistDescription={watchlist?.description || ''}
          watchlistImage={watchlist?.image || ''}
          username={user?.email || ''}
          addSharedUser={(user) => setSharedUsers([...sharedUsers, user])}
          removeSharedUser={(userId) => setSharedUsers(sharedUsers.filter(u => u.id !== userId))}
          updateSharedUsers={setSharedUsers}
        />
      )}
    </div>
  );
};

export default WatchlistPage; 