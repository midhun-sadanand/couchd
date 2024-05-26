import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const ShareWatchlist = ({ onShare, userId }) => {
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState('');

    useEffect(() => {
        
        console.log('Current userId!! : ', userId);

        if (!userId) return;  // Only fetch if userId is available
        fetchFriends();
    }, [userId]);  // Add userId as a dependency

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
    

    const handleShare = () => {
        if (selectedFriend) {
            onShare(selectedFriend);
            setSelectedFriend('');  // Reset selection after sharing
        } else {
            alert('Please select a friend to share the watchlist with.');
        }
    };


    return (
        <div>
            <select value={selectedFriend} onChange={(e) => setSelectedFriend(e.target.value)} className="border p-2 rounded">
                <option value="">Select a friend</option>
                {friends.map(friend => (
                    <option key={friend.id} value={friend.id}>
                        {friend.username}
                    </option>
                ))}
            </select>
            <button onClick={handleShare} className="ml-2 btn bg-blue-500 hover:bg-blue-700 text-white p-2 rounded">
                Share Watchlist
            </button>
        </div>
    );
};

export default ShareWatchlist;
