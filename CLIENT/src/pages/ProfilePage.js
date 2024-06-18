import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react'; // Add useSession
import { SupabaseContext } from '../utils/auth';
import WatchlistPage from '../pages/WatchlistPage';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { username } = useParams(); // Get username from URL
  const { client: supabase, isLoading: supabaseLoading } = useContext(SupabaseContext);

  const { isLoaded, user } = useUser(); // Get user
  const { session } = useSession(); // Get session

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [toggle, setToggle] = useState(1);

  useEffect(() => {
    if (supabaseLoading) {
      console.log("Supabase client is still loading");
      return;
    }
    if (!supabase) {
      console.error("Supabase client is not available");
      navigate('/');
      return;
    }
    if (!isLoaded || !session) {
      console.log("Clerk client or session is still loading");
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const token = await session.getToken(); // Get token from session
        console.log("TOKEN", token);
        const response = await fetch('http://localhost:3001/api/users', {
          headers: {
            Authorization: `Bearer ${token}`, // Use the token in the request header
          },
        });
        const users = await response.json();
        console.log('Users response:', users);

        if (!Array.isArray(users)) {
          throw new Error("Invalid response format: Expected an array of users");
        }

        const fetchedUser = users.find(u => u.username === username);
        if (!fetchedUser) {
          console.error("User not found");
          navigate('/');
          return;
        }
        setProfileUser(fetchedUser);

        const { data: friendsData, error } = await supabase
          .from('friends')
          .select('friend_id')
          .eq('user_id', fetchedUser.id)
          .eq('status', 'accepted');

        if (error) {
          console.error('Error fetching friends:', error.message);
          return;
        }

        const friendsDetails = await Promise.all(
          friendsData.map(async (friend) => {
            try {
              const friendResponse = await fetch(`http://localhost:3001/api/user/${friend.friend_id}`, {
                headers: {
                  Authorization: `Bearer ${token}`, // Use the token in the request header
                },
              });
              const friendDetails = await friendResponse.json();
              return { id: friend.friend_id, username: friendDetails.username };
            } catch (error) {
              console.error('Error fetching friend details:', error.message);
              return null;
            }
          })
        );

        setFriends(friendsDetails.filter(friend => friend !== null));
        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error.message);
        navigate('/');
      }
    };

    fetchUserProfile();
  }, [username, navigate, supabase, supabaseLoading, isLoaded, session]); // Add session to the dependency array

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
          <span className="py-1 pl-4 cursor-pointer text-right border-b border-[#e6e6e6]" onClick={() => updateToggle(1)}>Profile</span>
          <span className="py-1 pl-4 cursor-pointer text-right border-b border-[#e6e6e6]" onClick={() => updateToggle(2)}>Friends</span>
          <span className="py-1 pl-4 cursor-pointer text-right border-b border-[#e6e6e6]" onClick={() => updateToggle(3)}>Lists</span>
        </div>
      </div>
      <div id="profile" className={toggle === 1 ? "w-3/5" : "hidden"}>
        <h1 className="mb-16 text-center grid grid-cols-1">
          <span className="text-4xl">Welcome back, </span>
          <span className="text-8xl">{profileUser.username}</span>
        </h1>
      </div>
      <div id="friendspage" className={toggle === 2 ? "flex justify-between pt-8 w-5/6" : "hidden"}>
        <div className="w-1/2">
          <span>Existing Friends</span>
          {friends.map(friend => (
            <div key={friend.id} className="border-b flex justify-between w-3/4 grid grid-cols-2">
              {friend.username}
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
