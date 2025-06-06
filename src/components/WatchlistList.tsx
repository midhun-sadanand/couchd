import React, { useEffect, useState } from 'react';
import { useUser } from '@/utils/auth';
import { useSupabaseClient } from '@/utils/auth';
import WatchlistWidget from './WatchlistWidget';
import AddWatchlistModal from './AddWatchlistModal';
import { Plus } from '@geist-ui/icons';

interface WatchlistListProps {
  userId?: string;
  isFriendSidebarOpen?: boolean;
  isLibrarySidebarOpen?: boolean;
}

const WatchlistList: React.FC<WatchlistListProps> = ({ userId, isFriendSidebarOpen = false, isLibrarySidebarOpen = false }) => {
  const { user, loading: userLoading } = useUser();
  const supabase = useSupabaseClient();
  const [watchlists, setWatchlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [availableWidth, setAvailableWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

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

  useEffect(() => {
    const fetchWatchlists = async () => {
      setLoading(true);
      setError(null);
      try {
        const uid = userId || user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });
        if (error) throw error;
        // Parse tags for each watchlist
        const parsed = (data || []).map((wl: any) => {
          let tags: string[] = [];
          if (wl.tags) {
            try {
              tags = Array.isArray(wl.tags) ? wl.tags : JSON.parse(wl.tags);
            } catch {
              tags = wl.tags.split(',').map((t: string) => t.trim());
            }
          }
          return { ...wl, tags };
        });
        setWatchlists(parsed);
        // Set tag options
        const allTags = new Set<string>();
        parsed.forEach(wl => (wl.tags || []).forEach((tag: string) => allTags.add(tag)));
        setOptions([...allTags].map(tag => ({ label: tag, value: tag })));
      } catch (err: any) {
        setError(err.message || 'Failed to load watchlists');
      } finally {
        setLoading(false);
      }
    };
    if ((userId || user) && supabase) fetchWatchlists();
  }, [userId, user, supabase]);

  // Responsive grid columns
  const calculateGridCols = (width: number) => {
    if (width >= 1200) return 4;
    if (width >= 960) return 3;
    if (width >= 720) return 2;
    return 1;
  };
  const gridCols = calculateGridCols(availableWidth);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#e6e6e6] bg-[#232323]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#e6e6e6] mb-4"></div>
        <span>Loading your watchlists...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!user && !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#e6e6e6]">
        You must be logged in to view your watchlists.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#232323]" style={{ padding: '0 16px' }}>
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
        {watchlists.length === 0 ? (
          <div className="col-span-full text-gray-400 text-xl text-center mt-20">
            You have no watchlists yet.<br />
            Click the <span className="inline-block align-middle"><Plus color="#e6e6e6" /></span> button below to create one!
          </div>
        ) : (
          watchlists.map((list: any) => (
            <WatchlistWidget
              key={list.id}
              watchlistId={list.id}
              username={user?.username || user?.email || ''}
              listName={list.name}
              description={list.description}
              unwatchedCount={list.to_consume_count}
              watchingCount={list.consuming_count}
              watchedCount={list.consumed_count}
              tags={list.tags || []}
              deleteWatchlist={() => {}} // Implement as needed
            />
          ))
        )}
      </div>
      {/* Floating Add Button */}
      <button
        className="plus-button fixed bottom-8 right-8 bg-[#232323] rounded-full shadow-lg p-4 hover:bg-[#333] transition"
        onClick={() => setShowModal(true)}
        style={{ zIndex: 50 }}
        aria-label="Add Watchlist"
      >
        <Plus color="#e6e6e6" size={32} />
      </button>
      <AddWatchlistModal
        user={user}
        visible={showModal}
        onClose={() => setShowModal(false)}
        options={options}
        setOptions={setOptions}
        setWatchlists={setWatchlists}
        watchlists={watchlists}
      />
    </div>
  );
};

export default WatchlistList; 