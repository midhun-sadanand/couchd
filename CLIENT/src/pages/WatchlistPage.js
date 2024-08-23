import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth';
import WatchlistWidget from '../components/common/WatchlistWidget';
import { Plus } from '@geist-ui/icons';
import AddWatchlistModal from '../components/AddWatchlistModal';
import { useWatchlists } from '../hooks/useWatchlists';
import { useQueryClient } from '@tanstack/react-query';

const WatchlistPage = ({ isFriendSidebarOpen, isLibrarySidebarOpen }) => {
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState([]);
  const [availableWidth, setAvailableWidth] = useState(window.innerWidth);
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser();
  const { client: supabase } = useContext(SupabaseContext);
  const { data: watchlistData, error } = useWatchlists(clerkUser?.id);
  const queryClient = useQueryClient();

  const watchlists = watchlistData?.watchlists || [];

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      navigate('/login');
      return;
    }
  }, [clerkUser, isLoaded, navigate]);

  useEffect(() => {
    if (watchlists.length > 0) {
      const allTags = new Set();
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
    updateAvailableWidth();
    window.addEventListener('resize', updateAvailableWidth);
    return () => window.removeEventListener('resize', updateAvailableWidth);
  }, [isFriendSidebarOpen, isLibrarySidebarOpen]);

  const deleteWatchlist = async (deletedId) => {
    if (window.confirm(`Are you sure you want to delete this list?`)) {
      try {
        const { error: watchlistError } = await supabase
          .from('watchlists')
          .delete()
          .match({ id: deletedId });

        if (watchlistError) {
          throw watchlistError;
        }

        const { error: ownershipError } = await supabase
          .from('watchlist_ownership')
          .delete()
          .match({ watchlist_id: deletedId });

        if (ownershipError) {
          throw ownershipError;
        }

        const { error: sharingError } = await supabase
          .from('watchlist_sharing')
          .delete()
          .match({ watchlist_id: deletedId });

        if (sharingError) {
          throw sharingError;
        }

        queryClient.invalidateQueries(['watchlists', clerkUser.id]);
      } catch (error) {
        console.error('Error deleting list:', error.message);
      }
    }
  };

  if (error) {
    console.error('Error fetching watchlists:', error.message);
    return <div>Error loading watchlists</div>;
  }

  const calculateGridCols = (width) => {
    if (width >= 1200) return 4;  // 4 columns for larger screens
    if (width >= 960) return 3;   // 3 columns for medium screens
    if (width >= 720) return 2;   // 2 columns for smaller screens
    return 1;                     // 1 column for very small screens
  };

  const gridCols = calculateGridCols(availableWidth);

  return (
    <div className={`container mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-${gridCols} gap-4 relative`}>
      <h1 className="text-6xl my-10 text-[#e6e6e6] font-bold col-span-full text-center">Your Watchlists</h1>
      {watchlists.map((list) => (
        <WatchlistWidget
          key={list.id}
          watchlistId={list.id}
          username={clerkUser.username}
          listName={list.name}
          description={list.description}
          unwatchedCount={list.to_consume_count}
          watchingCount={list.consuming_count}
          watchedCount={list.consumed_count}
          tags={list.tags || []}
          deleteWatchlist={deleteWatchlist}
        />
      ))}
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
        user={clerkUser}
      />
    </div>
  );
};

export default WatchlistPage;
