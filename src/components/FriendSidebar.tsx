import React, { useState, useEffect } from 'react';
import { X } from '@geist-ui/icons';
import { useUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '../utils/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface FriendSidebarProps {
  friendsProfiles?: Friend[];
  friendRequests?: any[];
  handleAcceptRequest: (requestId: string) => Promise<void>;
  handleRejectRequest: (requestId: string) => Promise<void>;
  handleSearch: (query: string) => Promise<void>;
  searchResults?: any[];
  closeSidebar: () => void;
  sidebarOpen: boolean;
  userId: string;
}

function generateUUID(userId: string): string {
  const cleanId = userId.replace(/[^a-zA-Z0-9]/g, '');
  const uuid = `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(12, 16)}-${cleanId.slice(16, 20)}-${cleanId.slice(20, 32)}`;
  return uuid;
}

const FriendSidebar: React.FC<FriendSidebarProps> = ({
  friendsProfiles = [],
  friendRequests = [],
  handleAcceptRequest,
  handleRejectRequest,
  handleSearch,
  searchResults = [],
  closeSidebar,
  sidebarOpen,
  userId
}) => {
  const [friendName, setFriendName] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResultsState, setSearchResultsState] = useState<any[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const { user } = useUser();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user || !supabase) return;

      try {
        // // Get friends using user_id directly
        // const { data, error } = await supabase
        //   .from('friends')
        //   .select('friend_id, profiles:friend_id (user_id, username, avatar_url)')
        //   .eq('user_id', user.id);

        // if (error) throw error;
        // setFriends((data || []).map((item: any) => ({
        //   id: item.profiles?.user_id,
        //   username: item.profiles?.username,
        //   avatar_url: item.profiles?.avatar_url || null
        // })).filter((f: Friend) => f.id && f.username));
      } catch (err) {
        console.error('Error fetching friends:', err instanceof Error ? err : new Error('Failed to fetch friends'));
      }
    };

    fetchFriends();
  }, [user, supabase]);

  const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!supabase) return;

    try {
      await supabase
        .from('friend_requests')
        .update({ status })
        .eq('id', requestId);

      if (status === 'accepted') {
        const request = requests.find(req => req.id === requestId);
        if (!request || !request.sender) {
          console.error('Request or sender not found', request);
          return;
        }

        // Create bidirectional friend relationship using user_ids directly
        await Promise.all([
          supabase
            .from('friends')
            .insert([{
              user_id: request.sender_id,
              friend_id: userId,
              created_at: new Date().toISOString()
            }]),
          supabase
            .from('friends')
            .insert([{
              user_id: userId,
              friend_id: request.sender_id,
              created_at: new Date().toISOString()
            }])
        ]);

        setRequests(prev => prev.filter(req => req.id !== requestId));
      } else {
        setRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  };

  const searchFriends = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return;

    const name = event.target.value;
    setFriendName(name);
    if (name.length >= 3) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', `%${name}%`)
          .limit(10);

        if (error) throw error;
        setSearchResultsState(data || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching for friends:', error);
        setSearchResultsState([]);
      }
    } else {
      setSearchResultsState([]);
      setShowDropdown(false);
    }
  };

  const handleSelectFriend = (friendId: string) => {
    setSelectedFriendId(friendId);
    const friend = searchResultsState.find(friend => friend.id === friendId);
    setFriendName(friend ? friend.username : '');
    setShowDropdown(false);
  };

  const checkAccepted = async (userId: string, friendId: string) => {
    if (!supabase) return false;

    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .eq('friend_id', friendId)
        .eq('status', 'accepted');

      if (error) throw error;
      return !!data.length;
    } catch (error) {
      console.error('Error checking friend status:', error);
      return false;
    }
  };

  const sendFriendRequest = async () => {
    if (!selectedFriendId || !user || !supabase) return;
    setFriendName('');

    try {
      const isAccepted = await checkAccepted(user.id, selectedFriendId);
      if (isAccepted) {
        alert('You are already friends!');
        return;
      }

      await supabase
        .from('friend_requests')
        .insert([{
          sender_id: user.id,
          receiver_id: selectedFriendId,
          status: 'pending'
        }]);

      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div 
      className={`fixed top-24 right-0 h-full w-60 bg-[#232323] text-white p-4 z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ right: sidebarOpen ? '0' : '-240px' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Friend Activity</h2>
        <button onClick={closeSidebar} className="text-white">
          <X />
        </button>
      </div>

      <ul>
        {friends.length > 0 ? (
          friends.map(friend => (
            <li key={friend.id} className="mb-4 flex items-center">
              <img 
                src={friend.avatar_url ? friend.avatar_url : ''} 
                alt={friend.username} 
                className="w-10 h-10 object-cover rounded-full mr-2" 
              />
              <div>
                <div className="font-bold">{friend.username}</div>
              </div>
            </li>
          ))
        ) : (
          <li>No friends found.</li>
        )}
      </ul>
      
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Enter friend's name"
          value={friendName}
          onChange={searchFriends}
          className="border p-2 w-full"
        />
        <button 
          onClick={sendFriendRequest} 
          className="mt-2 btn bg-blue-500 hover:bg-blue-700 text-white w-full"
        >
          Send Request
        </button>
        {showDropdown && searchResultsState.length > 0 && (
          <div className="absolute mt-1 w-full bg-white shadow-lg z-10">
            <ul>
              {searchResultsState.map(friend => (
                <li 
                  key={friend.id} 
                  className="p-2 hover:bg-gray-200 cursor-pointer"
                  onClick={() => handleSelectFriend(friend.id)}
                >
                  {friend.username}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <div className="flex justify-between items-center">
          <button 
            onClick={() => setShowDropdown(!showDropdown)} 
            className="btn flex"
          >
            <span className="border-2 rounded-full py-3 px-5 mx-2">
              {requests.length}
            </span>
            <span className="p-2">Incoming Requests</span>
          </button>
        </div>
        {showDropdown && requests.length > 0 && (
          <div className="absolute bg-white shadow-md mt-2 rounded z-10">
            <ul>
              {requests.map(request => (
                <li key={request.id} className="p-2 border-b border-gray-200">
                  <span className="mr-2">
                    Request from {request.sender ? request.sender.username : "Unknown"}
                  </span>
                  <button 
                    onClick={() => handleResponse(request.id, 'accepted')} 
                    className="ml-2 btn bg-green-500 hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleResponse(request.id, 'rejected')} 
                    className="ml-2 btn bg-red-500 hover:bg-red-600"
                  >
                    Reject
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendSidebar; 