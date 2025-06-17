import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp } from '@geist-ui/icons';
import { useSupabaseClient } from '../utils/auth';
import type { SupabaseClient } from '@supabase/supabase-js';

const SIDEBAR_WIDTH = 240; // w-60
const SIDEBAR_MARGIN = 16;
const SIDEBAR_RADIUS = 16;
const SIDEBAR_HEIGHT = 'calc(100vh - 5.5rem)';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showRequests, setShowRequests] = useState(true);

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

  useEffect(() => {
    if (friendsProfiles.length > 0 && friendsProfiles[0].avatar_url) {
      setAvatarUrl(friendsProfiles[0].avatar_url);
    }
  }, [friendsProfiles]);

  const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
    if (!supabase) return;

    try {
      console.log('Updating friend request status:', { requestId, status });
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

        console.log('Creating friend relationships:', {
          sender_id: request.sender_id,
          receiver_id: userId
        });

        // Create bidirectional friend relationship using user_ids directly
        const [firstInsert, secondInsert] = await Promise.all([
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

        console.log('First friend relationship created:', firstInsert);
        console.log('Second friend relationship created:', secondInsert);

        if (firstInsert.error) console.error('Error creating first friendship:', firstInsert.error);
        if (secondInsert.error) console.error('Error creating second friendship:', secondInsert.error);

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
        .from('friend_requests')
        .select('*')
        .eq('sender_id', userId)
        .eq('status', 'accepted')
        .eq('receiver_id', friendId);

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

      // Check if trying to send request to self
      if (receiverId === userId) {
        setError('You cannot send a friend request to yourself.');
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

  // Always render the sidebar and the subtle edge bar
  return (
    <>
      {/* Subtle clickable edge when sidebar is closed */}
      {!sidebarOpen && (
        <div
          className="fixed top-14 right-0 w-2 bg-[#181818] cursor-pointer z-50 rounded-l-lg"
          style={{
            margin: `${SIDEBAR_MARGIN}px 0 ${SIDEBAR_MARGIN}px 0`,
            height: SIDEBAR_HEIGHT,
            transition: 'background 0.2s',
          }}
          onClick={closeSidebar}
        />
      )}
      <div
        className={`fixed top-14 right-0 bg-[#181818] px-3 m-2 shadow-lg flex flex-col mb-4 border border-[#232323] z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-[-10px]' : 'translate-x-full'}`}
        style={{
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          borderRadius: `${SIDEBAR_RADIUS}px`,
          margin: `${SIDEBAR_MARGIN}px 0 ${SIDEBAR_MARGIN}px 0`,
          height: SIDEBAR_HEIGHT,
          bottom: 'auto',
          boxSizing: 'border-box',
          pointerEvents: sidebarOpen ? 'auto' : 'none',
          cursor: sidebarOpen ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
        onClick={e => {
          if ((e.target as HTMLElement).closest('.friend-card')) return;
          closeSidebar();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mt-2 mb-4 select-none" style={{ minHeight: 32 }}>
          <h2 className="text-xl text-white font-semibold">Friends</h2>
          <button onClick={e => { e.stopPropagation(); closeSidebar(); }} className="text-white hover:bg-[#232323] rounded p-1 transition-colors">
            <X size={22} />
          </button>
        </div>
        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-base text-white font-semibold mb-2">Your Friends</h3>
          <ul className="flex flex-col gap-2 mb-2">
            {friendsProfiles.length > 0 ? (
              friendsProfiles.map(friend => (
                <li key={friend.id} className="flex items-center gap-3 bg-[#232323] rounded-lg px-3 py-2">
                  <img
                    src={friend.avatar_url || '/default-avatar.png'}
                    alt={friend.username}
                    className="w-9 h-9 rounded-full object-cover border border-[#444]"
                    onError={e => (e.currentTarget.src = '/default-avatar.png')}
                  />
                  <span className="text-white font-medium truncate">{friend.username}</span>
                </li>
              ))
            ) : (
              <li className="text-gray-400">No friends yet.</li>
            )}
          </ul>
          {/* Incoming Friend Requests Toggle */}
          <hr className="w-48 border-t border-[#333] mb-2" style={{ margin: '0 auto', marginTop: 20, marginBottom: 0}} />
          <div className="mb-2">
            <button
              className="flex items-center gap-2 text-white font-semibold text-base focus:outline-none w-full mt-2 px-2 py-2 rounded hover:bg-[#232323] transition-colors"
              style={{ justifyContent: 'space-between' }}
              onClick={e => { e.stopPropagation(); setShowRequests(v => !v); }}
            >
              <span className="flex items-center gap-2">
                Incoming Requests
                <span className="text-xs text-gray-400 font-normal">({friendRequests.length})</span>
              </span>
              <span className={`transition-transform duration-300 ${showRequests ? '' : ''}`}>
                {showRequests ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </span>
            </button>
            {showRequests && (
              <div className="flex flex-col gap-3 mt-2">
                {friendRequests.length > 0 ? (
                  friendRequests.map((req: any) => (
                    <div key={req.id} className="friend-card flex items-center bg-[#222] rounded-lg shadow border border-[#232323] px-3 py-2 gap-3">
                      <img
                        src={req.sender?.avatar_url || '/default-avatar.png'}
                        alt={req.sender?.username || 'Avatar'}
                        className="w-12 h-12 rounded-full object-cover border border-[#444]"
                        onError={e => (e.currentTarget.src = '/default-avatar.png')}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{req.sender?.username || 'Unknown'}</div>
                        {req.sender?.mutual_friends && req.sender.mutual_friends > 0 && (
                          <div className="text-xs text-gray-400 truncate">{req.sender.mutual_friends} mutual friends</div>
                        )}
                      </div>
                      <button
                        className="px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors mr-2"
                        onClick={e => { e.stopPropagation(); handleAcceptRequest(req.id); }}
                      >
                        Confirm
                      </button>
                      <button
                        className="px-4 py-1 rounded bg-[#363636] text-white font-semibold hover:bg-[#232323] transition-colors"
                        onClick={e => { e.stopPropagation(); handleRejectRequest(req.id); }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm px-2 py-3 text-center">No pending requests</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default FriendSidebar; 