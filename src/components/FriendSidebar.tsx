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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
    setSuccessMessage(null);
    
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
      // Check if they're already friends in the friends table (bidirectional check)
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('id')
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (friendError) {
        console.error('Error checking friends table:', friendError);
        return false;
      }
      
      if (friendData && friendData.length > 0) return true;

      return false;
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
      try {
        const isAccepted = await checkAccepted(userId, receiverId);
        if (isAccepted) {
          setError('You are already friends with this user!');
          return;
        }
      } catch (friendCheckError) {
        console.error('Error checking friendship status:', friendCheckError);
        // Continue with the request even if friend check fails
      }
      const { error: insertError } = await supabase
        .from('friend_requests')
        .insert([{
          sender_id: userId,
          receiver_id: receiverId,
          status: 'pending'
        }]);

      if (insertError) {
        console.error('Error inserting friend request:', insertError);
        throw insertError;
      }
      setFriendName('');
      setSelectedFriendId(null);
      setSearchResultsState([]);
      setShowDropdown(false);
      setSuccessMessage('Friend request sent successfully!');
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
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
          className="fixed top-14 right-0 w-2 bg-[#1a1a1a] cursor-pointer z-50 rounded-l-lg"
          style={{
            margin: `${SIDEBAR_MARGIN}px 0 ${SIDEBAR_MARGIN}px 0`,
            height: SIDEBAR_HEIGHT,
            transition: 'background 0.2s',
          }}
          onClick={closeSidebar}
        />
      )}
      <div
        className={`fixed top-14 right-0 bg-[#1a1a1a] px-4 m-2 shadow-2xl flex flex-col mb-4 border border-[#333333] z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-[-10px]' : 'translate-x-full'}`}
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
        <div className="flex items-center justify-between mt-3 mb-4 select-none" style={{ minHeight: 32 }}>
          <h2 className="text-xl text-white font-eina-bold">Friends</h2>
          <button onClick={e => { e.stopPropagation(); closeSidebar(); }} className="text-[#666666] hover:text-white hover:bg-[#2a2a2a] rounded-full p-1.5 transition-all">
            <X size={20} />
          </button>
        </div>
        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-sm text-[#cccccc] font-eina-bold mb-3">Your Friends</h3>
          <ul className="flex flex-col gap-2 mb-4">
            {friendsProfiles.length > 0 ? (
              friendsProfiles.map(friend => (
                <li key={friend.id} className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg px-3 py-2.5 border border-[#3a3a3a] hover:bg-[#2f2f2f] transition-colors">
                  <img
                    src={friend.avatar_url || '/default-avatar.png'}
                    alt={friend.username}
                    className="w-9 h-9 rounded-full object-cover border border-[#4a4a4a]"
                    onError={e => (e.currentTarget.src = '/default-avatar.png')}
                  />
                  <span className="text-white font-eina truncate">{friend.username}</span>
                </li>
              ))
            ) : (
              <li className="text-[#666666] text-sm px-2 py-3 text-center">No friends yet.</li>
            )}
          </ul>

          {/* Add Friends Section */}
          <hr className="w-full border-t border-[#3a3a3a] my-4" />
          <div className="mb-4">
            <h3 className="text-sm text-[#cccccc] font-eina-bold mb-3">Add Friends</h3>
            <div className="relative">
              <input
                type="text"
                value={friendName}
                onChange={searchFriends}
                placeholder="Search by username..."
                className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#4a4a4a] focus:bg-[#2f2f2f] transition-all font-eina text-sm"
                onClick={e => e.stopPropagation()}
              />
              
              {/* Search Results Dropdown */}
              {showDropdown && searchResultsState.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-2xl z-10 max-h-40 overflow-y-auto">
                  {searchResultsState.map(user => (
                    <button
                      key={user.id}
                      className="w-full px-3 py-2 text-left text-white hover:bg-[#3a3a3a] transition-colors flex items-center gap-2 font-eina text-sm"
                      onClick={e => { e.stopPropagation(); handleSelectFriend(user.id); }}
                    >
                      <div className="w-6 h-6 bg-[#3a3a3a] rounded-full flex items-center justify-center text-xs text-[#cccccc]">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{user.username}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Send Request Button */}
            <button
              onClick={e => { e.stopPropagation(); sendFriendRequest(); }}
              disabled={!friendName.trim()}
              className="w-full mt-3 px-3 py-2.5 bg-[#3a3a3a] text-white font-einasemibold rounded-lg hover:bg-[#454545] disabled:bg-[#2a2a2a] disabled:text-[#666666] disabled:cursor-not-allowed transition-all text-sm"
            >
              Send Friend Request
            </button>
            
            {/* Error Display */}
            {error && (
              <div className="mt-3 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg">
                <p className="text-[#d4a5a5] text-xs font-eina">{error}</p>
              </div>
            )}
            
            {/* Success Display */}
            {successMessage && (
              <div className="mt-3 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg">
                <p className="text-[#a5d4b4] text-xs font-eina">{successMessage}</p>
              </div>
            )}
          </div>

          {/* Incoming Friend Requests Toggle */}
          <hr className="w-full border-t border-[#3a3a3a] my-4" />
          <div className="mb-2">
            <button
              className="flex items-center gap-2 text-[#cccccc] font-eina-bold text-sm focus:outline-none w-full px-2 py-2 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              style={{ justifyContent: 'space-between' }}
              onClick={e => { e.stopPropagation(); setShowRequests(v => !v); }}
            >
              <span className="flex items-center gap-2">
                Incoming Requests
                <span className="text-xs text-[#666666] font-eina">({friendRequests.length})</span>
              </span>
              <span className={`transition-transform duration-300 ${showRequests ? '' : ''}`}>
                {showRequests ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>
            {showRequests && (
              <div className="flex flex-col gap-2 mt-3">
                {friendRequests.length > 0 ? (
                  friendRequests.map((req: any) => (
                    <div key={req.id} className="friend-card flex flex-col bg-[#2a2a2a] rounded-lg border border-[#3a3a3a] px-3 py-3 gap-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.sender?.avatar_url || '/default-avatar.png'}
                          alt={req.sender?.username || 'Avatar'}
                          className="w-10 h-10 rounded-full object-cover border border-[#4a4a4a]"
                          onError={e => (e.currentTarget.src = '/default-avatar.png')}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-eina-bold text-sm truncate">{req.sender?.username || 'Unknown'}</div>
                          {req.sender?.mutual_friends && req.sender.mutual_friends > 0 && (
                            <div className="text-xs text-[#666666] truncate font-eina">{req.sender.mutual_friends} mutual friends</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#3a3a3a] text-white font-einasemibold hover:bg-[#454545] transition-colors text-xs"
                          onClick={e => { e.stopPropagation(); handleAcceptRequest(req.id); }}
                        >
                          Confirm
                        </button>
                        <button
                          className="flex-1 px-3 py-1.5 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-white font-einasemibold hover:bg-[#363636] transition-colors text-xs"
                          onClick={e => { e.stopPropagation(); handleRejectRequest(req.id); }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[#666666] text-xs px-2 py-3 text-center font-eina">No pending requests</div>
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