import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useClerk } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth'; // Import the context directly
import FriendsBar from '../components/FriendsBar';
import FriendRequestsDropdown from '../components/FriendRequests';
import WatchlistPage from '../pages/WatchlistPage';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser(); // Get Clerk user
  const { client: supabase, isLoading: supabaseLoading } = useContext(SupabaseContext); // Use context to get Supabase client and its loading state
  const { client: clerkClient } = useClerk(); // Get Clerk client

  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);
  const [toggle, setToggle] = useState(1);

  useEffect(() => {
    if (supabaseLoading) {
      console.log("Supabase client is still loading");
      return; // Do nothing while the client is loading
    }
    if (!supabase) {
      console.error("Supabase client is not available");
      navigate('/');
      return;
    }

    const fetchFriends = async () => {
      if (!clerkUser) {
        console.error("No Clerk user information available.");
        navigate('/');
        return;
      }

      const { data: friendsData, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', clerkUser.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error.message);
        return;
      }

      const friendsDetails = await Promise.all(
        friendsData.map(async (friend) => {
          try {
            const friendDetails = await clerkClient.users.getUser(friend.friend_id);
            return { id: friend.friend_id, username: friendDetails.username };
          } catch (error) {
            console.error('Error fetching friend details:', error.message);
            return null;
          }
        })
      );

      setFriends(friendsDetails.filter(friend => friend !== null));
      setLoading(false);
    };

    fetchFriends();
  }, [clerkUser, navigate, supabase, supabaseLoading, clerkClient]);

  if (loading || supabaseLoading) {
    return <div>Loading...</div>;
  }

  const updateToggle = (id) => {
    setToggle(id);
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center pt-10 text-[#e6e6e6]">
      <div className="flex justify-end w-5/6">
        <div className="tab-bar grid grid-cols-1">
          <span className="py-1 pl-4 cursor-pointer text-right border-b border-[#e6e6e6]" onClick={()=>updateToggle(1)}>Profile</span>
          <span className="py-1 pl-4 cursor-pointer text-right border-b border-[#e6e6e6]" onClick={()=>updateToggle(2)}>Friends</span>
          <span className="py-1 pl-4 cursor-pointer text-right border-b border-[#e6e6e6]" onClick={()=>updateToggle(3)}>Lists</span>
        </div>
      </div>
      <div id="profile" className={toggle === 1 ? "w-3/5" : "hidden"}>
        <h1 className="mb-16 text-center grid grid-cols-1">
          <span className="text-4xl">Welcome back, </span>
          <span className="text-8xl">{`${clerkUser.username || 'No Profile Data'}`}</span>
        </h1>
        <div className="flex justify-between">
          <div className="flex flex-col justify-center"><div>profile pic</div></div>
          <div className="grid grid-cols-2">
          <div className="flex flex-col justify-between text-left p-3">
              <span>unfinished items</span>
              <span className="text-2xl">insert number</span>
            </div>
            <div className="flex flex-col justify-between text-left p-3">
              <span>unfinished items</span>
              <span className="text-2xl">insert number</span>
            </div>
            <div className="flex flex-col justify-between text-left p-3">
              <span>unfinished items</span>
              <span className="text-2xl">insert number</span>
            </div>
            <div className="flex flex-col justify-between text-left p-3">
              <span>unfinished items</span>
              <span className="text-2xl">insert number</span>
            </div>
            <div className="flex flex-col justify-between text-left p-3">
              <span>unfinished items</span>
              <span className="text-2xl">insert number</span>
            </div>
          </div>
        </div>
      </div>
      <div id="friendspage" className={toggle === 2 ? "flex justify-between pt-8 w-5/6" : "hidden"}>
        <div className="w-1/2 flex flex-col items-center">
          <div className="p-3"><FriendsBar userId={clerkUser.id}/></div>
          <div className="p-3"><FriendRequestsDropdown userId={clerkUser.id}/></div>
        </div>
        <div className="w-1/2 border-l h-screen">
          <span>existing friends</span>
          {friends.map(friend => (
            <div key={friend.id} className="border-b flex justify-between w-3/4 grid grid-cols-2">
              {friend.username}
              {/* Add delete button or other interaction */}
            </div>
          ))}
        </div>
      </div>
      <div id="watchlists" className={toggle === 3 ? "show" : "hidden"}>
        <WatchlistPage />
      </div>
    </div>
  );
};

export default ProfilePage;