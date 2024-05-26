import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const FriendRequestsDropdown = ({ userId }) => {
    const [requests, setRequests] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const fetchRequests = async () => {
            const { data, error } = await supabase
                .from('friend_requests')
                .select(`
                    id,
                    status,
                    sender_id,
                    sender: sender_id (username)  // Join to fetch the username from profiles table
                `)
                .eq('receiver_id', userId)
                .eq('status', 'pending');

            if (error) {
                console.error('Error fetching friend requests:', error.message);
            } else {
                setRequests(data);
            }
        };

        if (userId) fetchRequests();
    }, [userId]);

    const handleResponse = async (requestId, status) => {
        const { error } = await supabase
            .from('friend_requests')
            .update({ status })
            .eq('id', requestId);

        if (error) {
            console.error('Error updating friend request:', error.message);
        } else {
            setRequests(requests.filter(request => request.id !== requestId));
        }
    };

    return (
        <div>
            <button onClick={() => setShowDropdown(!showDropdown)} className="btn">
                Friend Requests
            </button>
            {showDropdown && (
                <div className="absolute bg-white shadow-md mt-2 rounded">
                    <ul>
                        {requests.map(request => (
                            <li key={request.id} className="p-2 border-b border-gray-200">
                                Request from {request.sender.username}  // Display the username instead of sender_id
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
    );
};

export default FriendRequestsDropdown;
