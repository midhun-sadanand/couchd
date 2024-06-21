import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth';
import WatchlistPage from '../pages/WatchlistPage';
import ProfileSearchBar from '../components/ProfileSearchBar';
import defaultProfile from '../components/assets/images/pfp.png';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { username } = useParams();
  const { client: supabase, isLoading: supabaseLoading } = useContext(SupabaseContext);

  const { isLoaded, user } = useUser();
  const { session } = useSession();

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
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
        const token = await session.getToken();
        const response = await fetch('http://localhost:3001/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const users = await response.json();

        const fetchedUser = users.data.find(u => u.username === username);
        if (!fetchedUser) {
          console.error("User not found");
          navigate('/');
          return;
        }
        setProfileUser(fetchedUser);

        const { data: friendsData, error: friendsError } = await supabase
          .from('friends')
          .select('*')
          .eq('user_id', fetchedUser.id)
          .eq('status', 'accepted');

        if (friendsError) {
          console.error('Error fetching friends:', friendsError.message);
          return;
        }

        setFriends(friendsData);

        const { data: friendRequestsData, error: friendRequestsError } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('receiver_id', fetchedUser.id)
          .eq('status', 'pending');

        if (friendRequestsError) {
          console.error('Error fetching friend requests:', friendRequestsError.message);
          return;
        }

        setFriendRequests(friendRequestsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user profile:", error.message);
        navigate('/');
      }
    };

    fetchUserProfile();
  }, [username, navigate, supabase, supabaseLoading, isLoaded, session]);

  const sendFriendRequest = async (receiverId, receiverUsername) => {
    try {
      const token = await session.getToken();
      const response = await fetch('http://localhost:3001/api/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId: user.id, senderUsername: user.username, receiverId, receiverUsername }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Failed to send friend request: ${errorResponse.error}`);
      }

      console.log('Friend request sent');
    } catch (error) {
      console.error('Error sending friend request:', error.message);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = await session.getToken();
      const response = await fetch('http://localhost:3001/api/friend-request/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Failed to accept friend request: ${errorResponse.error}`);
      }

      console.log('Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = await session.getToken();
      const response = await fetch('http://localhost:3001/api/friend-request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Failed to reject friend request: ${errorResponse.error}`);
      }

      console.log('Friend request rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error.message);
    }
  };

  const handleSearch = async (query) => {
    try {
      const token = await session.getToken();
      const response = await fetch(`http://localhost:3001/api/search?query=${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(`Failed to fetch search results: ${errorResponse.error}`);
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching for users:', error.message);
      setSearchResults([]); // Clear previous results on error
    }
  };

  if (loading || supabaseLoading) {
    return <div>Loading...</div>;
  }

  const updateToggle = (id) => {
    setToggle(id);
  };

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
      <div id="friendspage" className={toggle === 2 ? "flex flex-col pt-8 w-5/6" : "hidden"}>
        <ProfileSearchBar onSearch={handleSearch} />
        <div className="w-full mb-8">
          <h2 className="text-2xl mb-4">Search Results</h2>
          {searchResults.length > 0 && (
            searchResults.map(u => (
              <div key={u.id} className="border-b flex justify-between w-3/4 grid grid-cols-2">
                <span className="cursor-pointer" onClick={() => navigate(`/profile/${u.username}`)}>
                  <img src={u.profile_image_url || defaultProfile} alt="Profile" className="w-8 h-8 rounded-full inline-block mr-2" />
                  {u.username}
                </span>
                <button onClick={() => sendFriendRequest(u.id, u.username)} className="text-blue-500">Add Friend</button>
              </div>
            ))
          )}
        </div>
        <div className="w-1/2">
          <h2 className="text-2xl mb-4">Existing Friends</h2>
          {friends.map(friend => (
            <div key={friend.id} className="border-b flex justify-between w-3/4 grid grid-cols-2">
              <span>{friend.friend_username}</span>
            </div>
          ))}
        </div>
        <div className="w-1/2 mt-8">
          <h2 className="text-2xl mb-4">Friend Requests</h2>
          {friendRequests.map(request => (
            <div key={request.id} className="border-b flex justify-between w-3/4 grid grid-cols-2">
              <span>{request.sender_username}</span>
              <div>
                <button onClick={() => handleAcceptRequest(request.id)} className="text-green-500 mr-2">Accept</button>
                <button onClick={() => handleRejectRequest(request.id)} className="text-red-500">Reject</button>
              </div>
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
