import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth'; // Import the context directly
import WatchlistWidget from '../components/common/WatchlistWidget'; // Ensure the path is correct
import { Button } from '@geist-ui/core'; // Import Geist components
import { Plus } from '@geist-ui/icons'; // Import Geist icon
import AddWatchlistModal from '../components/AddWatchlistModal'; // Import the new modal component
import { useWatchlists } from '../hooks/useWatchlists';
import { useQueryClient } from '@tanstack/react-query'; // Import useQueryClient

const WatchlistPage = () => {
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState([]);
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser(); // Get Clerk user and isLoaded property
  const { client: supabase } = useContext(SupabaseContext); // Use context to get Supabase client
  const { data: watchlists, error } = useWatchlists(clerkUser?.id);
  const queryClient = useQueryClient(); // Initialize useQueryClient

  useEffect(() => {
    if (!isLoaded) return; // Wait until Clerk user is fully loaded
    if (!clerkUser) {
      navigate('/login');
      return;
    }
  }, [clerkUser, isLoaded, navigate]);

  useEffect(() => {
    if (watchlists) {
      const allTags = new Set();
      watchlists.forEach(watchlist => {
        watchlist.tags.forEach(tag => allTags.add(tag));
      });

      setOptions([...allTags].map(tag => ({ label: tag, value: tag })));
    }
  }, [watchlists]);

  const deleteWatchlist = async (deletedId) => {
    if (window.confirm(`Are you sure you want to delete this list?`)) {
      try {
        // Delete the watchlist itself
        const { error: watchlistError } = await supabase
          .from('watchlists')
          .delete()
          .match({ id: deletedId });

        if (watchlistError) {
          throw watchlistError;
        }

        // Delete the ownership entry
        const { error: ownershipError } = await supabase
          .from('watchlist_ownership')
          .delete()
          .match({ watchlist_id: deletedId });

        if (ownershipError) {
          throw ownershipError;
        }

        // Delete the sharing entries
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

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 relative">
      <h1 className="text-6xl my-10 text-[#e6e6e6] font-bold col-span-full text-center">Your Watchlists</h1>
      {watchlists && watchlists.map((list) => (
        <WatchlistWidget
          key={list.id}
          watchlistId={list.id} // Pass the watchlist ID for deletion
          username={clerkUser.username}
          listName={list.name}
          description={list.description} // Pass the description to the widget
          unwatchedCount={list.to_consume_count}
          watchingCount={list.consuming_count}
          watchedCount={list.consumed_count}
          tags={list.tags || []} // Ensure tags is always an array
          deleteWatchlist={deleteWatchlist} // Pass the delete function
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
