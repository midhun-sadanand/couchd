import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useSupabaseClient } from '../utils/auth'; // Make sure this path is correct
import WatchlistPage from './WatchlistPage';
import FriendsBar from '../components/common/FriendsBar';
import FriendRequestsDropdown from '../components/common/FriendRequests';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: clerkUser } = useUser(); // Get Clerk user
  const supabase = useSupabaseClient();
    useEffect(() => {
    console.log("Supabase client in ProfilePage:", supabase);
    if (!supabase) {
        console.error("Supabase client is null in ProfilePage");
        navigate('/');  // Optionally redirect if the client isn't available
        return;
    }
    // Fetch profile data logic...
    }, [supabase, navigate]);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!clerkUser) {
        console.error("No Clerk user information available.");
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('clerk_id', clerkUser.id)  // Assuming 'clerk_id' is stored in the profiles table
        .single();

      if (error) {
        console.error('Error fetching Supabase profile:', error.message);
        navigate('/');
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfileData();
  }, [clerkUser, navigate, supabase]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profile) return;
      const { data, error } = await supabase
        .from('friends')
        .select('friend_id, friend_profile:friend_id (username)')
        .eq('user_id', profile.user_id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error.message);
      } else {
        setFriends(data);
      }
    };

    if (profile) fetchFriends();
  }, [profile, supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-screen h-screen flex flex-col items-center pt-10">
      <div className="flex justify-end w-5/6">
        <div className="tab-bar grid grid-cols-3">
          <span className="py-1 cursor-pointer text-right border-b border-black">Profile</span>
          <span className="py-1 cursor-pointer text-right border-b border-black">Lists</span>
          <span className="py-1 cursor-pointer text-right border-b border-black">Friends</span>
        </div>
      </div>
      <h1 className="text-2xl mb-16 text-center">{profile ? `Profile: ${profile.username}` : 'No Profile Data'}</h1>
      <div>
        <strong>Email:</strong> {clerkUser.emailAddresses.length > 0 ? clerkUser.emailAddresses[0].emailAddress : 'No email available'}
        <br/>
        <strong>Account Created:</strong> {new Date(clerkUser.createdAt).toLocaleString()}
      </div>
      <div className={friends.length > 0 ? "grid grid-cols-2" : "hidden"}>
        {friends.map(friend => (
          <div key={friend.id} className="border-b flex justify-between w-3/4">
            {friend.friend_profile.username}
            {/* Add delete button or other interaction */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;

