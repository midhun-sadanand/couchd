import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser, useSession } from '@clerk/clerk-react';
import { SupabaseContext } from '../utils/auth';
import WatchlistPage from '../pages/WatchlistPage';
import ProfileSearchBar from '../components/ProfileSearchBar';
import RecentActivity from '../components/RecentActivity';
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
  const [watchlists, setWatchlists] = useState([]);

  useEffect(() => {
    if (supabaseLoading || !isLoaded || !session) return;

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
          navigate('/');
          return;
        }
        setProfileUser(fetchedUser);

        const { data: friendsData } = await supabase
          .from('friends')
          .select('friends')
          .eq('profile_id', fetchedUser.id);
        setFriends(friendsData[0]?.friends || []);

        const { data: friendRequestsData } = await supabase
          .from('friend_requests')
          .select('*')
          .eq('receiver_id', fetchedUser.id)
          .eq('status', 'pending');
        setFriendRequests(friendRequestsData);

        const { data: watchlistsData } = await supabase
          .from('watchlists')
          .select('*')
          .eq('user_id', fetchedUser.id);
        setWatchlists(watchlistsData);

        setLoading(false);
      } catch (error) {
        navigate('/');
      }
    };

    fetchUserProfile();
  }, [username, navigate, supabase, supabaseLoading, isLoaded, session]);

  const sendFriendRequest = async (receiverId, receiverUsername) => {
    try {
      const token = await session.getToken();
      await fetch('http://localhost:3001/api/friend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ senderId: user.id, senderUsername: user.username, receiverId, receiverUsername }),
      });
    } catch (error) {
      console.error('Error sending friend request:', error.message);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = await session.getToken();
      await fetch('http://localhost:3001/api/friend-request/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
    } catch (error) {
      console.error('Error accepting friend request:', error.message);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const token = await session.getToken();
      await fetch('http://localhost:3001/api/friend-request/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId }),
      });
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

      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      setSearchResults([]);
    }
  };

  if (loading || supabaseLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-screen h-screen flex bg-[#0a0a0d]">
      {/* Left Sidebar */}
      <div className="w-1/5 bg-[#0a0a0d] text-white p-4">
        <h2 className="text-2xl mb-4">Your Watchlists</h2>
        <ul>
          {watchlists.map(list => (
            <li key={list.id} className="cursor-pointer mb-2" onClick={() => navigate(`/list/${username}/${encodeURIComponent(list.name)}/${list.id}`)}>
              {list.name}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content */}
      <div className="w-3/4 bg-[#0a0a0d] text-white p-4">
        <WatchlistPage />
        <RecentActivity />
      </div>

      {/* Right Sidebar */}
      <div className="w-1/5 bg-[#0a0a0d] text-white p-4">
        <ProfileSearchBar onSearch={handleSearch} />
        <div className="mb-8">
          <h2 className="text-2xl mb-4">Search Results</h2>
          {searchResults.map(u => (
            <div key={u.id} className="border-b flex justify-between py-2">
              <span className="cursor-pointer" onClick={() => navigate(`/profile/${u.username}`)}>
                <img src={u.profile_image_url || defaultProfile} alt="Profile" className="w-8 h-8 rounded-full mr-2" />
                {u.username}
              </span>
              <button onClick={() => sendFriendRequest(u.id, u.username)} className="text-blue-500">Add Friend</button>
            </div>
          ))}
        </div>
        <div>
          <h2 className="text-2xl mb-4">Existing Friends</h2>
          {friends.map(friend => (
            <div key={friend.id} className="border-b py-2">
              <span>{friend.username}</span>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <h2 className="text-2xl mb-4">Friend Requests</h2>
          {friendRequests.map(request => (
            <div key={request.id} className="border-b flex justify-between py-2">
              <span>{request.sender_username}</span>
              <div>
                <button onClick={() => handleAcceptRequest(request.id)} className="text-green-500 mr-2">Accept</button>
                <button onClick={() => handleRejectRequest(request.id)} className="text-red-500">Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
