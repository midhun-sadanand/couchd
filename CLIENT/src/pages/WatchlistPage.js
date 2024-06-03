import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth'; // Import the context directly

const WatchlistPage = () => {
  const [watchlists, setWatchlists] = useState([]);
  const [watchlistName, setWatchlistName] = useState('');
  const navigate = useNavigate();
  const { user: clerkUser } = useUser(); // Get Clerk user
  const { client: supabase } = useContext(SupabaseContext); // Use context to get Supabase client

  useEffect(() => {
    const fetchUserData = async () => {
      if (!clerkUser) {
        navigate('/login');
        return;
      }

      fetchWatchlists(clerkUser.id);
    };

    fetchUserData();
  }, [clerkUser, navigate, supabase]);

  const fetchWatchlists = async (userId) => {
    // Query to fetch watchlists that the user owns
    const ownWatchlistsQuery = supabase
      .from('watchlists')
      .select('*')
      .eq('user_id', userId);

    // Query to fetch watchlists that are shared with the user
    const sharedWatchlistsQuery = supabase
      .from('watchlist_shares')
      .select(`
        watchlist_id,
        watchlist:watchlist_id (id, name, user_id)
      `)
      .eq('shared_with_user_id', userId);

    try {
      let { data: ownWatchlists, error: ownError } = await ownWatchlistsQuery;
      let { data: sharedWatchlistsData, error: sharedError } = await sharedWatchlistsQuery;

      if (ownError) {
        console.error('Error fetching own watchlists:', ownError.message);
        return;
      }
      if (sharedError) {
        console.error('Error fetching shared watchlists:', sharedError.message);
        return;
      }

      // Map shared watchlists to have the same structure as own watchlists
      const sharedWatchlists = sharedWatchlistsData.map(item => item.watchlist);

      // Combine own and shared watchlists
      const combinedWatchlists = [...ownWatchlists, ...sharedWatchlists];
      setWatchlists(combinedWatchlists);
    } catch (error) {
      console.error('Error fetching watchlists:', error.message);
    }
  };

  const createWatchlist = async () => {
    if (!watchlistName) return;

    const { data, error } = await supabase
      .from('watchlists')
      .insert([{ name: watchlistName, user_id: clerkUser.id }]);

    if (error) {
      console.error('Error creating watchlist:', error.message);
    } else {
      setWatchlists([...watchlists, ...data]); // Update local state with new watchlist
      navigate(`/${clerkUser.username}/${watchlistName}`);
      setWatchlistName(''); // Clear the field after creation
    }
  };

  const deleteWatchlist = async (deletedId) => {
    if (window.confirm(`Are you sure you want to delete this list?`)) {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .match({ id: deletedId });

      if (error) {
        console.error('Error deleting list:', error.message);
      } else {
        setWatchlists(currentWatchlists => currentWatchlists.filter(list => list.id !== deletedId));
      }
    }
  };

  return (
    <div className="container mx-auto p-4 grid grid-cols-3 gap-4">
      <h1 className="text-xl font-bold col-span-3">Your Watchlists</h1>
      <div className="col-span-3 flex justify-end">
        <input
          type="text"
          value={watchlistName}
          onChange={(e) => setWatchlistName(e.target.value)}
          placeholder="Enter Watchlist Name"
          className="border p-2 my-4"
        />
        <button onClick={() => createWatchlist()} className="ml-2 my-4 bg-blue-500 text-white p-2 rounded">
          Create Watchlist
        </button>
      </div>
      {watchlists.map((list) => (
        <div key={list.id} className="p-4 m-4 border-2 rounded-lg shadow-lg flex flex-col items-center justify-center">
          <button className="text-2xl font-bold text-blue-500 hover:text-blue-600" onClick={() => navigate(`/list/${clerkUser.username}/${list.name}`)}>
            {list.name}
          </button>
          <button className="mt-2 text-red-500 hover:underline" onClick={() => deleteWatchlist(list.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
};

export default WatchlistPage;