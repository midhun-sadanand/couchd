import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';  // Adjust path as needed

const FriendsBar = ({ userId }) => {
    const [friendName, setFriendName] = useState('');
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    const searchFriends = async (event) => {
        const name = event.target.value;
        setFriendName(name);
        if (name.length >= 3) { 
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('username, user_id')
                    .ilike('username', `%${name}%`);
                
                if (error) throw error;
                
                setSearchResults(data);
                setShowDropdown(true);
            } catch (error) {
                console.error('Error searching for friends:', error.message);
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }
    };

    const handleSelectFriend = (friendId) => {
        setSelectedFriendId(friendId);
        const friend = searchResults.find(friend => friend.user_id === friendId);
        setFriendName(friend ? friend.username : '');

        console.log('Selected friend:', friend);   
        setShowDropdown(false);
    };

    const checkAccepted = async (userId, requestId) => {
        const { data, error } = await supabase
            .from('friends')
            .select()
            .match({ 'user_id' : userId , 'friend_id' : requestId, 'status' : 'accepted'})
        
        console.log('this is the data: ', data);
        
        if (error) {
            console.error('Error checking row existence: ', error);
            return false;
        } else if (data.length > 0) {
            console.log('i am returning');
            return true;
        } else {
            console.log('hello');
            return false;
        }
    }


    const sendFriendRequest = async () => {
        if (!selectedFriendId) return;
        setFriendName('');

        try {
            const isAccepted = await checkAccepted(userId, selectedFriendId);
            if (isAccepted) {
                alert('You are already friends!');
                return;
            }

            const { error } = await supabase
                .from('friend_requests')
                .insert([{ sender_id: userId, receiver_id: selectedFriendId }]);

            if (error) throw error;
            alert('Friend request sent!');
        } catch (error) {
            console.error('Error sending friend request:', error.message);
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Enter friend's name"
                value={friendName}
                onChange={searchFriends}
                className="border p-2"
            />
            <button onClick={sendFriendRequest} className="ml-2 btn bg-blue-500 hover:bg-blue-700 text-white">
                Send Request
            </button>
            {showDropdown && searchResults.length > 0 && (
                <div className="absolute mt-1 w-52 bg-white shadow-lg">
                    <ul>
                        {searchResults.map(friend => (
                            <li key={friend.user_id} className="p-2 hover:bg-gray-200 cursor-pointer"
                                onClick={() => handleSelectFriend(friend.user_id)}>
                                {friend.username}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FriendsBar;
