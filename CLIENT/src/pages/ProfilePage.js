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

    const deleteFriend = async (deletedId) => {
        if (window.confirm(`Are you sure you want to delete this friend?`)) {
            const { error } = await supabase
                .from('friends')
                .delete()
                .eq( 'user_id' , userId )
                .eq( 'friend_id' , deletedId )

            if (error) {
                console.error('Error deleting friend:', error.message);
            } else {
                setFriends(currentFriends => currentFriends.filter(friend => friend.id !== deletedId ));
            }
        }
    };

    return (
        <div className="w-screen h-screen flex flex-col items-center pt-10">
            <div className="flex justify-end w-5/6">
                <div className="tab-bar grid grid-col-1">
                    <span className="py-1 cursor-pointer text-right border-b border-black" onClick={()=>updateToggle(1)}>Profile</span>
                    <span className="py-1 cursor-pointer text-right border-b border-black" onClick={()=>updateToggle(2)}>Lists</span>
                    <span className="pl-4 py-1 cursor-pointer text-right border-b border-black" onClick={()=>updateToggle(3)}>Friends</span>
                </div>
            </div>
                <div className={toggle === 1 ? "show w-5/6" : "hidden"}>
                    <h1 className="text-2xl mb-16 text-left">profpic {username}</h1>
                    <div className="mt-16">
                        <span className="border-2 m-4 rounded-full py-8 px-4">lists: {friends.length}</span>
                        <span className="border-2 m-4 rounded-full py-8 px-4">to consume: </span>
                        <span className="border-2 m-4 rounded-full py-8 px-4">consuming: </span>
                        <span className="border-2 m-4 rounded-full py-8 px-4">consumed: </span>
                    </div>
                </div>
                <div className={toggle === 2 ? "w-screen" : "hidden"}>
                    <WatchlistPage />
                </div>
                <div className={toggle === 3 ? "grid grid-cols-2" : "hidden"}>
                    <div className="h-screen border-r-2 flex flex-col items-center">
                        <div className="m-6">requests</div>
                        <div className="m-6"><FriendsBar userId={userId}/></div>
                        <FriendRequestsDropdown userId={userId}/>
                    </div>
                    <div className="flex flex-col items-center">
                        <h2 className="p-2 my-4">friends</h2>
                        {friends.map(friend => (
                        <div className="border-b flex justify-between w-3/4">
                            {friend.username}
                            <button className="hover:underline" onClick={() => deleteFriend(friend.id)}>remove</button>
                        </div>
                        ))}
                    </div>
                </div>
            </div>
    );
};


export default ProfilePage;
