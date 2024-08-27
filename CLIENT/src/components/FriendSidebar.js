import React, { useState, useEffect } from 'react';
import { X } from '@geist-ui/icons';
import supabase from '../utils/supabaseClient';
import { useUser, useClerk } from '@clerk/clerk-react';

const FriendSidebar = ({
  friendsProfiles = [], // Default to an empty array if undefined
  friendRequests = [],  // Default to an empty array if undefined
  handleAcceptRequest,
  handleRejectRequest,
  handleSearch,
  searchResults = [],  // Default to an empty array if undefined
  closeSidebar,
  sidebarOpen,
  userId
}) => {
  const [friendName, setFriendName] = useState('');
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [requests, setRequests] = useState([]);
  const [searchResultsState, setSearchResultsState] = useState([]); // Used for handling search results
  const { user: clerkUser } = useUser();
  const { client } = useClerk();

  useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          id,
          status,
          sender_id,
          sender:sender_id (
            username
          )
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching friend requests:', error.message);
      } else {
        setRequests(data || []);
      }
    };

    fetchRequests();
  }, [userId]);

  const handleResponse = async (requestId, status) => {
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status })
      .match({ id: requestId });

    if (updateError) {
      console.error('Error updating friend request:', updateError.message);
      return;
    }

    if (status === 'accepted') {
      const request = requests.find(req => req.id === requestId);
      if (!request || !request.sender) {
        console.error('Request or sender not found', request);
        return;
      }

      const { error: insertError } = await supabase
        .from('friends')
        .insert([
          { user_id: userId, friend_id: request.sender_id, status: 'accepted' },
          { user_id: request.sender_id, friend_id: userId, status: 'accepted' }
        ]);

      if (insertError) {
        console.error('Error adding friend:', insertError.message);
      } else {
        setRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } else {
      setRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const searchFriends = async (event) => {
    const name = event.target.value;
    setFriendName(name);
    if (name.length >= 3) {
      try {
        const users = await client.users.getUserList({
          query: name,
          limit: 10
        });
        setSearchResultsState(users); // Set the state for search results
        setShowDropdown(true);
      } catch (error) {
        console.error('Error searching for friends:', error.message);
        setSearchResultsState([]);
      }
    } else {
      setSearchResultsState([]);
      setShowDropdown(false);
    }
  };

  const handleSelectFriend = (friendId) => {
    setSelectedFriendId(friendId);
    const friend = searchResultsState.find(friend => friend.id === friendId);
    setFriendName(friend ? friend.username : '');
    setShowDropdown(false);
  };

  const checkAccepted = async (userId, requestId) => {
    const { data, error } = await supabase
      .from('friends')
      .select()
      .match({ user_id: userId, friend_id: requestId, status: 'accepted' });

    if (error) {
      console.error('Error checking row existence: ', error);
      return false;
    } else if (data.length > 0) {
      return true;
    } else {
      return false;
    }
  };

  const sendFriendRequest = async () => {
    if (!selectedFriendId) return;
    setFriendName('');

    try {
      const isAccepted = await checkAccepted(clerkUser.id, selectedFriendId);
      if (isAccepted) {
        alert('You are already friends!');
        return;
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert([{ sender_id: clerkUser.id, receiver_id: selectedFriendId }]);

      if (error) throw error;
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error.message);
    }
  };

  return (
    <div 
      className={`fixed top-24 right-0 h-full w-60 bg-[#232323] text-white p-4 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ right: sidebarOpen ? '0' : '-240px' }}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl">Friend Activity</h2>
        <button onClick={closeSidebar} className="text-white">
          <X />
        </button>
      </div>

      <ul>
        {friendsProfiles.length > 0 ? (
          friendsProfiles.map(friend => (
            <li key={friend.id} className="mb-4 flex items-center">
              <img src={friend.imageUrl} alt={friend.username} className="w-10 h-10 object-cover rounded-full mr-2" />
              <div>
                <div className="font-bold">{friend.username}</div>
                <div className="text-sm text-gray-400">Last active: {friend.lastActive}</div>
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
        <button onClick={sendFriendRequest} className="mt-2 btn bg-blue-500 hover:bg-blue-700 text-white w-full">
          Send Request
        </button>
        {showDropdown && searchResultsState.length > 0 && (
          <div className="absolute mt-1 w-full bg-white shadow-lg z-10">
            <ul>
              {searchResultsState.map(friend => (
                <li key={friend.id} className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleSelectFriend(friend.id)}>
                  {friend.username}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <div className="flex justify-between items-center">
          <button onClick={() => setShowDropdown(!showDropdown)} className="btn flex">
            <span className="border-2 rounded-full py-3 px-5 mx-2">{requests.length}</span>
            <span className="p-2">Incoming Requests</span>
          </button>
        </div>
        {showDropdown && requests.length > 0 && (
          <div className="absolute bg-white shadow-md mt-2 rounded z-10">
            <ul>
              {requests.map(request => (
                <li key={request.id} className="p-2 border-b border-gray-200">
                  <span className="mr-2">Request from {request.sender ? request.sender.username : "Unknown"}</span>
                  <button onClick={() => handleResponse(request.id, 'accepted')} className="ml-2 btn bg-green-500 hover:bg-green-600">
                    Accept
                  </button>
                  <button onClick={() => handleResponse(request.id, 'rejected')} className="ml-2 btn bg-red-500 hover:bg-red-600">
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
