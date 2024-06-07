import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth'; // Import the context directly
import WatchlistWidget from '../components/common/WatchlistWidget'; // Ensure the path is correct
import { Button } from '@geist-ui/core'; // Import Geist components
import { Plus } from '@geist-ui/icons'; // Import Geist icon
import AddWatchlistModal from '../components/AddWatchlistModal'; // Import the new modal component

const WatchlistPage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [options, setOptions] = useState([]);
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded } = useUser(); // Get Clerk user and isLoaded property
  const { client: supabase } = useContext(SupabaseContext); // Use context to get Supabase client

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoaded) return; // Wait until Clerk user is fully loaded
      if (!clerkUser) {
        navigate('/login');
        return;
      }

      await fetchWatchlists(clerkUser.id);
    };

    fetchUserData();
  }, [clerkUser, isLoaded, navigate, supabase]);

  const fetchWatchlists = async (userId) => {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return;
    }

    try {
      // Query to fetch watchlists that the user owns
      const { data: ownWatchlists, error: ownError } = await supabase
        .from('watchlists')
        .select('*')
        .eq('user_id', userId);

      if (ownError) {
        throw ownError;
      }

      // Query to fetch watchlists that are shared with the user
      const { data: sharedWatchlistsData, error: sharedError } = await supabase
        .from('watchlist_shares')
        .select(`
          watchlist_id,
          watchlist:watchlist_id (id, name, user_id, description, tags)
        `)
        .eq('shared_with_user_id', userId);

      if (sharedError) {
        throw sharedError;
      }

      // Map shared watchlists to have the same structure as own watchlists
      const sharedWatchlists = sharedWatchlistsData.map(item => item.watchlist);

      // Combine own and shared watchlists
      const combinedWatchlists = [...ownWatchlists, ...sharedWatchlists];

      // Fetch media items for each watchlist to compute counts
      for (const watchlist of combinedWatchlists) {
        const { data: mediaItems, error: mediaError } = await supabase
          .from('media_items')
          .select('status')
          .eq('watchlist_id', watchlist.id);

        if (mediaError) {
          throw mediaError;
        }

        watchlist.unwatchedCount = mediaItems.filter(item => item.status === 'to consume').length;
        watchlist.watchingCount = mediaItems.filter(item => item.status === 'consuming').length;
        watchlist.watchedCount = mediaItems.filter(item => item.status === 'consumed').length;

        // Parse tags from JSON string
        watchlist.tags = JSON.parse(watchlist.tags);
      }

      setWatchlists(combinedWatchlists);

      // Extract all unique tags
      const allTags = new Set();
      combinedWatchlists.forEach(watchlist => {
        watchlist.tags.forEach(tag => allTags.add(tag));
      });

      setOptions([...allTags].map(tag => ({ label: tag, value: tag })));
    } catch (error) {
      console.error('Error fetching watchlists:', error.message);
    }
  };

  const deleteWatchlist = async (deletedId) => {
    if (window.confirm(`Are you sure you want to delete this list?`)) {
      try {
        const { error } = await supabase
          .from('watchlists')
          .delete()
          .match({ id: deletedId });

        if (error) {
          throw error;
        }

        setWatchlists(currentWatchlists => currentWatchlists.filter(list => list.id !== deletedId));
      } catch (error) {
        console.error('Error deleting list:', error.message);
      }
    }
  };


  return (
    <div className="container mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 relative">
      <h1 className="text-6xl my-10 text-[#e6e6e6] font-bold col-span-full text-center">Your Watchlists</h1>
      {watchlists.map((list) => (
        <WatchlistWidget
          key={list.id}
          watchlistId={list.id} // Pass the watchlist ID for deletion
          username={clerkUser.username}
          listName={list.name}
          description={list.description} // Pass the description to the widget
          unwatchedCount={list.unwatchedCount}
          watchingCount={list.watchingCount}
          watchedCount={list.watchedCount}
          tags={list.tags || []} // Ensure tags is always an array
          deleteWatchlist={deleteWatchlist} // Pass the delete function
        />
      ))}
      <button
        className="plus-button"
        onClick={() => setShowModal(true)}
      >
        <Plus 
            color="#e6e6e6"
        />
      </button>
      <AddWatchlistModal 
        visible={showModal} 
        onClose={() => setShowModal(false)} 
        options={options} 
        setOptions={setOptions} 
        setWatchlists={setWatchlists}
        watchlists={watchlists}
        user={clerkUser}
      />
    </div>
  );
};

export default WatchlistPage;
