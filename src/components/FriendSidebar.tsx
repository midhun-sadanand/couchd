import React, { useState, useEffect } from 'react';
import { X } from '@geist-ui/icons';
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
  // Debug: Log the userId
  console.log('FriendSidebar userId:', userId);
  const [friendName, setFriendName] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResultsState, setSearchResultsState] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseClient();
  const [friends, setFriends] = useState<any[]>([]);

  // Fetch friend requests
  useEffect(() => {
    const fetchFriendRequests = async () => {
      if (!userId || !supabase) return;

      try {
        console.log('Fetching friend requests for user:', userId);
        const { data, error } = await supabase
          .from('friend_requests')
          .select(`
            id,
            sender_id,
            receiver_id,
            status,
            created_at,
            sender:profiles!sender_id (
              id,
              username
            )
          `)
          .eq('receiver_id', userId)
          .eq('status', 'pending');

        // Debug: Log the query result
        console.log('Friend request query result:', data, error);

        if (error) {
          console.error('Error fetching friend requests:', error);
          throw error;
        }

        console.log('Fetched friend requests:', data);
        setRequests(data || []);
      } catch (err) {
        console.error('Error in fetchFriendRequests:', err);
      }
    };

    fetchFriendRequests();
  }, [userId, supabase]);

  // Fetch friends
  useEffect(() => {
    const fetchFriends = async () => {
      if (!userId || !supabase) return;
      try {
        const { data, error } = await supabase
          .from('friends')
          .select(`
            friend_id,
            profiles:friend_id (
              id,
              username
            )
          `)
          .eq('user_id', userId);
        if (error) {
          console.error('Error fetching friends:', error);
          return;
        }
        setFriends((data || []).map((item: any) => item.profiles).filter(Boolean));
      } catch (err) {
        console.error('Error in fetchFriends:', err);
      }
    };
    fetchFriends();
  }, [userId, supabase]);

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
    setError(null);
    
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
        setError('Error searching for users');
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
    if (!userId || !supabase) return;
    try {
      setError(null);
      let receiverId = selectedFriendId;
      // If no selected friend, search for the username directly
      if (!receiverId) {
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', friendName)
          .single();
        if (userError || !userData) {
          setError('User not found. Please check the username and try again.');
          return;
        }
        receiverId = userData.id;
      }
      if (!receiverId) {
        setError('No receiver found.');
        return;
      }
      // Check for existing pending friend request
      const { data: existing, error: existingError } = await supabase
        .from('friend_requests')
        .select('id')
        .eq('sender_id', userId)
        .eq('receiver_id', receiverId)
        .eq('status', 'pending')
        .maybeSingle();
      if (existingError) {
        setError('Error checking for existing friend request.');
        return;
      }
      if (existing) {
        setError('Friend request already sent.');
        return;
      }
      // Check if already friends
      const isAccepted = await checkAccepted(userId, receiverId);
      if (isAccepted) {
        setError('You are already friends with this user!');
        return;
      }
      await supabase
        .from('friend_requests')
        .insert([{
          sender_id: userId,
          receiver_id: receiverId,
          status: 'pending'
        }]);
      setFriendName('');
      setSelectedFriendId(null);
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      setError('Failed to send friend request. Please try again.');
    }
  };

  if (!userId) return <div>Loading...</div>;

  return (
    <div 
      className={`fixed top-24 right-0 h-full w-60 bg-[#232323] text-white p-4 z-40 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ right: sidebarOpen ? '0' : '-240px' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Friends</h2>
        <button onClick={closeSidebar} className="text-white">
          <X />
        </button>
      </div>
      {/* Friends List */}
      <ul className="mb-4">
        {friends.length > 0 ? (
          friends.map(friend => (
            <li key={friend.id} className="mb-2 flex items-center">
              <span className="font-bold">{friend.username}</span>
            </li>
          ))
        ) : (
          <li className="text-gray-400">No friends yet.</li>
        )}
      </ul>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Enter friend's name"
          value={friendName}
          onChange={searchFriends}
          className="border p-2 w-full text-black bg-white rounded"
        />
        {error && (
          <div className="text-red-500 text-sm mt-1">{error}</div>
        )}
        <button 
          onClick={sendFriendRequest} 
          className="mt-2 btn bg-blue-500 hover:bg-blue-700 text-white w-full rounded"
        >
          Send Request
        </button>
        {showDropdown && searchResultsState.length > 0 && (
          <div className="absolute mt-1 w-full bg-white shadow-lg z-10 rounded">
            <ul>
              {searchResultsState.map(friend => (
                <li 
                  key={friend.id} 
                  className="p-2 hover:bg-gray-200 cursor-pointer text-black"
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
          <div className="absolute bg-white shadow-md mt-2 rounded z-10 w-full">
            <ul>
              {requests.map(request => (
                <li key={request.id} className="p-2 border-b border-gray-200 text-black">
                  <div className="flex flex-col">
                    <span className="mr-2">
                      Request from {request.sender?.username || "Unknown"}
                    </span>
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => handleResponse(request.id, 'accepted')} 
                        className="btn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleResponse(request.id, 'rejected')} 
                        className="btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
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