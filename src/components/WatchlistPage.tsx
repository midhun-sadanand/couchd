import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/utils/auth';
import { Plus } from '@geist-ui/icons';
import { useQueryClient } from '@tanstack/react-query';
import WatchlistWidget from './WatchlistWidget';
import AddWatchlistModal from './AddWatchlistModal';
import { useWatchlists } from '@/hooks/useWatchlists';
import { useSupabaseClient } from '../utils/auth';
import ImageUploadModal from './ImageUploadModal';
import ShareWatchlist from './ShareWatchlist';

interface WatchlistPageProps {
  isFriendSidebarOpen: boolean;
  isLibrarySidebarOpen: boolean;
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

const WatchlistPage: React.FC<WatchlistPageProps> = ({ 
  isFriendSidebarOpen, 
  isLibrarySidebarOpen 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState<TagOption[]>([]);
  const [availableWidth, setAvailableWidth] = useState<number>(0);
  const router = useRouter();
  const { user } = useUser();
  const { data: watchlistData, error } = useWatchlists(user?.id);
  const queryClient = useQueryClient();
  const supabase = useSupabaseClient();
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [sharedUsers, setSharedUsers] = useState<User[]>([]);

  const watchlists = watchlistData?.watchlists || [];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    if (watchlists.length > 0) {
      const allTags = new Set<string>();
      watchlists.forEach(watchlist => {
        watchlist.tags.forEach(tag => allTags.add(tag));
      });

      setOptions([...allTags].map(tag => ({ label: tag, value: tag })));
    }
  }, [watchlists]);

  const updateAvailableWidth = () => {
    const librarySidebarWidth = isLibrarySidebarOpen ? 240 : 0;
    const friendSidebarWidth = isFriendSidebarOpen ? 320 : 0;
    const adjustedWidth = window.innerWidth - librarySidebarWidth - friendSidebarWidth;
    setAvailableWidth(adjustedWidth);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      updateAvailableWidth();
      window.addEventListener('resize', updateAvailableWidth);
      return () => window.removeEventListener('resize', updateAvailableWidth);
    }
  }, [isFriendSidebarOpen, isLibrarySidebarOpen]);

  const deleteWatchlist = async (deletedId: string) => {
    if (window.confirm(`Are you sure you want to delete this list?`)) {
      try {
        // Delete watchlist and related data
        await supabase
          .from('watchlists')
          .delete()
          .eq('id', deletedId);

        // Invalidate queries to refresh the data
        queryClient.invalidateQueries(['watchlists', user?.id]);
      } catch (error) {
        console.error('Error deleting list:', error);
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

  if (error) {
    console.error('Error fetching watchlists:', error);
    return <div>Error loading watchlists</div>;
  }

  const calculateGridCols = (width: number) => {
    const librarySidebarWidth = isLibrarySidebarOpen ? 240 : 0;
    const friendSidebarWidth = isFriendSidebarOpen ? 320 : 0;
    const adjustedWidth = width - librarySidebarWidth - friendSidebarWidth;

    if (width >= 1200) return 4;  // 4 columns for larger screens
    if (width >= 960) return 3;   // 3 columns for medium screens
    if (width >= 720) return 2;   // 2 columns for smaller screens
    return 1;                     // 1 column for very small screens
  };

  const gridCols = calculateGridCols(availableWidth);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ padding: '0 16px' }}>
      <h1 className="text-6xl my-10 text-[#e6e6e6] font-bold text-center">
        Your Watchlists
      </h1>
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
        {watchlists.map((list: Watchlist) => (
          <WatchlistWidget
            key={list.id}
            watchlistId={list.id}
            username={user?.email || ''}
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
      <button
        className="plus-button"
        onClick={() => setShowModal(true)}
      >
        <Plus color="#e6e6e6" />
      </button>
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