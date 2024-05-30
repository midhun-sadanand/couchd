import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import WatchlistPage from './WatchlistPage';
import FriendsBar from '../components/common/FriendsBar';
import FriendRequestsDropdown from '../components/common/FriendRequests';




const ProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('Guest');
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [toggle, setToggle] = useState(1);
    const [friends, setFriends] = useState([]);


    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();


            if (!user) {
                navigate('/');
                return;
            }

            setUserId(user.id);


            const { data: profile, error } = await supabase
                .from('profiles')
                .select('username')
                .eq('user_id', user.id)
                .single();


            if (error) {
                console.error('Error fetching user data:', error.message);
                navigate('/');
            } else if (profile) {
                setUsername(profile.username);
            }


            setLoading(false);
        };


        const fetchFriends = async () => {
            const { data, error } = await supabase
                .from('friends')
                .select(`
                    friend_id,
                    friend_profile:friend_id (username) // Adjusted for correct relationship fetching
                `)
                .eq('user_id', userId)
                .eq('status', 'accepted');
       
            if (error) {
                console.error('Error fetching friends:', error.message);
            } else {
                console.log('Fetched friends data:', data); // Logs successful data fetch.
   
                setFriends(data.map(friend => ({
                    id: friend.friend_id,
                    username: friend.friend_profile.username  // Assuming the returned data structure from the query
                })));
            }
        };


        fetchUserData();


        if (!userId) return;  // Only fetch if userId is available
        fetchFriends();
    }, [navigate, userId]);


    if (loading) {
        return <div>Loading...</div>;
    }


    const updateToggle = (id) => {
        setToggle(id);
    }



    return (
        <div className="w-screen h-screen flex flex-col items-center pt-20">
            <h1 className="text-2xl text-center mb-10">
                Welcome back, <span className="underline">{username}</span>
            </h1>
            <div className="w-3/4">
                <ul className="tab-bar flex justify-center border-2 bg-gray-300">
                    <li className="px-4 py-2 cursor-pointer hover:bg-gray-500" onClick={()=>updateToggle(1)}>Add Item</li>
                    <li className="px-7 py-2 cursor-pointer hover:bg-gray-500" onClick={()=>updateToggle(2)}>Lists</li>
                    <li className="px-4 py-2 cursor-pointer hover:bg-gray-500" onClick={()=>updateToggle(3)}>Friends</li>
                </ul>
                <div className={toggle === 1 ? "show" : "hidden"}>
                    <h1>Add media:</h1>
                    <p>this is where you add media!</p>
                </div>
                <div className={toggle === 2 ? "show" : "hidden"}>
                    <WatchlistPage />
                </div>
                <div className={toggle === 3 ? "grid grid-cols-2" : "hidden"}>
                    <div className="h-screen border-r-2">
                        <div className="m-6"><FriendsBar userId={userId}/></div>
                        <FriendRequestsDropdown userId={userId}/>
                    </div>
                    <div>
                    <h2 className="p-2 mt-4">Friends: </h2>
                    {friends.map(friend => (
                    <p>{friend.username}</p>
                ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default ProfilePage;
