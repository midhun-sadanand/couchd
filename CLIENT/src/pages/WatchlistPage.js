import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth'; // Import the context directly
import WatchlistWidget from '../components/common/WatchlistWidget'; // Ensure the path is correct

const WatchlistPage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [watchlistName, setWatchlistName] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showModal, setShowModal] = useState(false);
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
          watchlist:watchlist_id (id, name, user_id)
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

        watchlist.unwatchedCount = mediaItems.filter(item => item.status === 'unwatched').length;
        watchlist.watchingCount = mediaItems.filter(item => item.status === 'watching').length;
        watchlist.watchedCount = mediaItems.filter(item => item.status === 'watched').length;
      }

      setWatchlists(combinedWatchlists);
    } catch (error) {
      console.error('Error fetching watchlists:', error.message);
    }
  };

  const createWatchlist = async () => {
    if (!watchlistName) return;

    try {
      const { data, error } = await supabase
        .from('watchlists')
        .insert([{ name: watchlistName, user_id: clerkUser.id, tags }]);

      if (error) {
        throw error;
      }

      setWatchlists([...watchlists, ...data]); // Update local state with new watchlist
      setWatchlistName(''); // Clear the field after creation
      setTags([]); // Clear tags
      setShowModal(false); // Close the modal
    } catch (error) {
      console.error('Error creating watchlist:', error.message);
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

  const handleTagInput = (e) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
      <h1 className="text-xl font-bold col-span-3">Your Watchlists</h1>
      {watchlists.map((list) => (
        <WatchlistWidget
          key={list.id}
          name={list.name}
          unwatchedCount={list.unwatchedCount}
          watchingCount={list.watchingCount}
          watchedCount={list.watchedCount}
        />
      ))}
      <div className="flex items-center justify-center">
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-[#303035] bg-opacity-80 rounded-full p-4 text-[#ffffff] focus:outline-none hover:bg-opacity-100 absolute bottom-4 right-4 md:static"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl mb-4">Create a New Watchlist</h2>
            <input
              type="text"
              value={watchlistName}
              onChange={(e) => setWatchlistName(e.target.value)}
              placeholder="Enter Watchlist Name"
              className="border p-2 w-full mb-4"
            />
            <div className="mb-4">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInput}
                placeholder="Enter tags and press enter"
                className="border p-2 w-full mb-2"
              />
              <div className="flex flex-wrap">
                {tags.map((tag, index) => (
                  <div key={index} className="bg-gray-200 text-gray-700 p-2 rounded-full flex items-center mr-2 mb-2">
                    {tag}
                    <button onClick={() => removeTag(index)} className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button 
                onClick={() => setShowModal(false)} 
                className="bg-gray-500 text-white p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button 
                onClick={createWatchlist} 
                className="bg-blue-500 text-white p-2 rounded"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistPage;
