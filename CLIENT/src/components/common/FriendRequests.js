import React, { useState, useEffect } from 'react';
import supabase from '../../utils/supabaseClient';

const FriendRequestsDropdown = ({ userId }) => {
    const [requests, setRequests] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

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
                    )  // Adjusted for correct relationship fetching
                `)
                .eq('receiver_id', userId)
                .eq('status', 'pending');

            if (error) {
                console.error('Error fetching friend requests:', error.message);
            } else {
                setRequests(data || []);
                console.log("Fetched friend requests:", data); // To debug and verify data structure
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
            return;  // Stop further execution in case of error
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
                    { user_id: userId, friend_id: request.sender_id, status: 'accepted' },  // Using sender.id, assuming id is part of fetched sender data
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

    console.log(requests);


    return (
        <div>
            <div className="flex justify-between items-center w-3/4">
            <button onClick={() => setShowDropdown(!showDropdown)} className="btn flex">
                <span className="border-2 rounded-full py-3 px-5 mx-2">{requests.length}</span>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 p-1 my-3">
                    <path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd" />
                </svg>
            </button>
            <span className="p-2 mx-16">incoming</span>
            </div>
            {showDropdown && requests.length > 0 && (
                <div className="absolute bg-white shadow-md mt-2 rounded">
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
    );
};

export default FriendRequestsDropdown;
