require('dotenv').config();
const express = require('express');
const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const cors = require('cors');
const supabase = require('../src/utils/supabaseClient'); // Assuming you have a Supabase client configured

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from React app
app.use(express.json());

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.error('Missing Clerk secret key');
  process.exit(1);
}

// Example endpoint with ClerkExpressRequireAuth middleware
app.get('/api/users', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  try {
    const usersResponse = await clerkClient.users.getUserList();
    res.json(usersResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:userId', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  try {
    const { userId } = req.params;
    const userResponse = await clerkClient.users.getUser(userId);
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add friend request endpoint
app.post('/api/friend-request', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { senderId, senderUsername, receiverId, receiverUsername } = req.body;
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert([{ sender_id: senderId, sender_username: senderUsername, receiver_id: receiverId, receiver_username: receiverUsername, status: 'pending' }]);

    if (error) {
      console.error('Error inserting friend request:', error);
      throw error;
    }
    res.status(201).json(data);
  } catch (error) {
    console.error('Error in friend request endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request endpoint
app.post('/api/friend-request/accept', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { requestId } = req.body;
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single(); // Ensure we get a single row

    if (error) {
      console.error('Error updating friend request:', error);
      throw error;
    }

    const { sender_id, sender_username, receiver_id, receiver_username } = data;

    const senderFriendUpdate = await supabase
      .rpc('append_friend', {
        p_profile_id: sender_id,
        p_friend_id: receiver_id,
        p_friend_username: receiver_username
      });

    if (senderFriendUpdate.error) {
      console.error('Error updating sender friends:', senderFriendUpdate.error);
      throw senderFriendUpdate.error;
    }

    const receiverFriendUpdate = await supabase
      .rpc('append_friend', {
        p_profile_id: receiver_id,
        p_friend_id: sender_id,
        p_friend_username: sender_username
      });

    if (receiverFriendUpdate.error) {
      console.error('Error updating receiver friends:', receiverFriendUpdate.error);
      throw receiverFriendUpdate.error;
    }

    res.status(200).json({ sender: senderFriendUpdate.data, receiver: receiverFriendUpdate.data });
  } catch (error) {
    console.error('Error in accept friend request endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request endpoint
app.post('/api/friend-request/reject', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { requestId } = req.body;
  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      console.error('Error deleting friend request:', error);
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in reject friend request endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to search for users by username
app.get('/api/search', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  console.log('Search endpoint hit');
  const { query } = req.query;
  try {
    const usersResponse = await clerkClient.users.getUserList();
    console.log('Users fetched:', usersResponse.data);
    const filteredUsers = usersResponse.data.filter(user =>
      user.username && user.username.toLowerCase().includes(query.toLowerCase())
    );
    console.log('Filtered users:', filteredUsers);
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error in search endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
