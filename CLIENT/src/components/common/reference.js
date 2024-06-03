
// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useClerk } from '@clerk/clerk-react';
// import { useSupabaseClient } from '../utils/auth'; // Import the hook

// const ProfilePage = () => {
//   const navigate = useNavigate();
//   const { user } = useClerk();  // Directly access the user object from the Clerk hook
//   const [loading, setLoading] = useState(true);
//   const supabase = useSupabaseClient();

//   useEffect(() => {
//     if (!user) {
//       console.error("No user information available");
//       navigate('/'); // Redirect or handle as necessary if user data isn't available
//     } else {
//       setLoading(false);
//     }
//   }, [user, navigate]);

//   if (loading) {
//     return <div>Loading user information...</div>;
//   }

//   return (
//     <div className="w-screen h-screen flex flex-col items-center pt-10">
//       <h1 className="text-2xl mb-16 text-center">Profile: {user.username} {user.lastName}</h1>
//       <div>
//         <strong>Email:</strong> {user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : 'No email available'}
//         <br/>
//         <strong>Account Created:</strong> {new Date(user.createdAt).toLocaleString()}
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;




// // ProfilePage.js
// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSupabaseClient } from '../utils/auth'; // Import the hook
// import WatchlistPage from './WatchlistPage';
// import FriendsBar from '../components/common/FriendsBar';
// import FriendRequestsDropdown from '../components/common/FriendRequests';

// const ProfilePage = () => {
//   const navigate = useNavigate();
//   const supabase = useSupabaseClient(); // Use the hook
//   const [username, setUsername] = useState('Guest');
//   const [loading, setLoading] = useState(true);
//   const [userId, setUserId] = useState(null);
//   const [toggle, setToggle] = useState(1);
//   const [friends, setFriends] = useState([]);

//   useEffect(() => {
//     const fetchUserData = async () => {
//       const { data: { user }, error: userError } = await supabase.auth.getUser();

//       if (userError || !user) {
//         console.log("Cooked.");
//         navigate('/');
//         return;
//       }

//       setUserId(user.id);

//       const { data: profile, error: profileError } = await supabase
//         .from('profiles')
//         .select('username')
//         .eq('user_id', user.id)
//         .single();

//       if (profileError) {
//         console.error('Error fetching user data:', profileError.message);
//         navigate('/');
//       } else if (profile) {
//         setUsername(profile.username);
//       }

//       setLoading(false);
//     };

//     const fetchFriends = async () => {
//       if (!userId) return; // Only fetch if userId is available
//       const { data, error } = await supabase
//         .from('friends')
//         .select(`
//           friend_id,
//           friend_profile:friend_id (username) // Adjusted for correct relationship fetching
//         `)
//         .eq('user_id', userId)
//         .eq('status', 'accepted');

//       if (error) {
//         console.error('Error fetching friends:', error.message);
//       } else {
//         console.log('Fetched friends data:', data); // Logs successful data fetch.

//         setFriends(data.map(friend => ({
//           id: friend.friend_id,
//           username: friend.friend_profile.username  // Assuming the returned data structure from the query
//         })));
//       }
//     };

//     fetchUserData();

//     if (userId) fetchFriends(); // Fetch friends if userId is available
//   }, [navigate, supabase, userId]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   const updateToggle = (id) => {
//     setToggle(id);
//   };

//   const deleteFriend = async (deletedId) => {
//     if (window.confirm(`Are you sure you want to delete this friend?`)) {
//       const { error } = await supabase
//         .from('friends')
//         .delete()
//         .or(`and(user_id.eq.${userId},friend_id.eq.${deletedId}),and(user_id.eq.${deletedId},friend_id.eq.${userId})`);

//       if (error) {
//         console.error('Error deleting friend:', error.message);
//       } else {
//         setFriends(currentFriends => currentFriends.filter(friend => friend.id !== deletedId));
//       }
//     }
//   };

//   return (
//     <div className="w-screen h-screen flex flex-col items-center pt-10">
//       <div className="flex justify-end w-5/6">
//         <div className="tab-bar grid grid-col-1">
//           <span className="py-1 cursor-pointer text-right border-b border-black" onClick={() => updateToggle(1)}>Profile</span>
//           <span className="py-1 cursor-pointer text-right border-b border-black" onClick={() => updateToggle(2)}>Lists</span>
//           <span className="pl-4 py-1 cursor-pointer text-right border-b border-black" onClick={() => updateToggle(3)}>Friends</span>
//         </div>
//       </div>
//       <div className={toggle === 1 ? "w-5/6" : "hidden"}>
//         <h1 className="text-2xl mb-16 text-left">profpic {username}</h1>
//         <div className="mt-16 grid grid-cols-4">
//           <div className="border-2 m-4 rounded-full py-8 px-4 grid grid-cols-1">
//             <span>lists: </span>
//             <span>{friends.length}</span>
//           </div>
//           <span className="border-2 m-4 rounded-full py-8 px-4">to consume: </span>
//           <span className="border-2 m-4 rounded-full py-8 px-4">consuming: </span>
//           <span className="border-2 m-4 rounded-full py-8 px-4">consumed: </span>
//         </div>
//       </div>
//       <div className={toggle === 2 ? "w-screen" : "hidden"}>
//         <WatchlistPage />
//       </div>
//       <div className={toggle === 3 ? "grid grid-cols-2" : "hidden"}>
//         <div className="h-screen border-r-2 flex flex-col items-center">
//           <div className="m-6">requests</div>
//           <div className="m-6"><FriendsBar userId={userId} /></div>
//           <FriendRequestsDropdown userId={userId} />
//         </div>
//         <div className="flex flex-col items-center">
//           <h2 className="p-2 my-4">friends</h2>
//           {friends.map(friend => (
//             <div className="border-b flex justify-between w-3/4" key={friend.id}>
//               {friend.username}
//               <button className="hover:underline" onClick={() => deleteFriend(friend.id)}>remove</button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;

// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useClerk, useUser } from '@clerk/clerk-react';
// import { useSupabaseClient } from '../utils/auth'; // Make sure this path is correct
// import WatchlistPage from './WatchlistPage';
// import FriendsBar from '../components/common/FriendsBar';
// import FriendRequestsDropdown from '../components/common/FriendRequests';

// const ProfilePage = () => {
//   const navigate = useNavigate();
//   const { user: clerkUser } = useUser(); // Get Clerk user
//   const supabase = useSupabaseClient();
//     useEffect(() => {
//     console.log("Supabase client in ProfilePage:", supabase);
//     if (!supabase) {
//         console.error("Supabase client is null in ProfilePage");
//         navigate('/');  // Optionally redirect if the client isn't available
//         return;
//     }
//     // Fetch profile data logic...
//     }, [supabase, navigate]);

//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [friends, setFriends] = useState([]);

//   useEffect(() => {
//     const fetchProfileData = async () => {
//       if (!clerkUser) {
//         console.error("No Clerk user information available.");
//         navigate('/login');
//         return;
//       }

//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('clerk_id', clerkUser.id)  // Assuming 'clerk_id' is stored in the profiles table
//         .single();

//       if (error) {
//         console.error('Error fetching Supabase profile:', error.message);
//         navigate('/');
//         return;
//       }

//       setProfile(data);
//       setLoading(false);
//     };

//     fetchProfileData();
//   }, [clerkUser, navigate, supabase]);

//   useEffect(() => {
//     const fetchFriends = async () => {
//       if (!profile) return;
//       const { data, error } = await supabase
//         .from('friends')
//         .select('friend_id, friend_profile:friend_id (username)')
//         .eq('user_id', profile.user_id)
//         .eq('status', 'accepted');

//       if (error) {
//         console.error('Error fetching friends:', error.message);
//       } else {
//         setFriends(data);
//       }
//     };

//     if (profile) fetchFriends();
//   }, [profile, supabase]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div className="w-screen h-screen flex flex-col items-center pt-10">
//       <div className="flex justify-end w-5/6">
//         <div className="tab-bar grid grid-cols-3">
//           <span className="py-1 cursor-pointer text-right border-b border-black">Profile</span>
//           <span className="py-1 cursor-pointer text-right border-b border-black">Lists</span>
//           <span className="py-1 cursor-pointer text-right border-b border-black">Friends</span>
//         </div>
//       </div>
//       <h1 className="text-2xl mb-16 text-center">{profile ? `Profile: ${profile.username}` : 'No Profile Data'}</h1>
//       <div>
//         <strong>Email:</strong> {clerkUser.emailAddresses.length > 0 ? clerkUser.emailAddresses[0].emailAddress : 'No email available'}
//         <br/>
//         <strong>Account Created:</strong> {new Date(clerkUser.createdAt).toLocaleString()}
//       </div>
//       <div className={friends.length > 0 ? "grid grid-cols-2" : "hidden"}>
//         {friends.map(friend => (
//           <div key={friend.id} className="border-b flex justify-between w-3/4">
//             {friend.friend_profile.username}
//             {/* Add delete button or other interaction */}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default ProfilePage;

