require('dotenv').config();
const express = require('express');
const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const cors = require('cors');
const supabase = require('../src/utils/supabaseClient');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.error('Missing Clerk secret key');
  process.exit(1);
}

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

app.post('/api/get-users', async (req, res) => {
  try {
    const { userIds } = req.body;
    const userPromises = userIds.map(userId => clerkClient.users.getUser(userId));
    const users = await Promise.all(userPromises);
    res.json(users);
  } catch (error) {
    console.error('Error fetching shared users:', error);
    res.status(500).json({ error: error.message });
  }
});

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

app.post('/api/friend-request/accept', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { requestId } = req.body;
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { sender_id, receiver_id } = data;

    const senderFriendUpdate = await supabase
      .rpc('append_friend', {
        p_profile_id: sender_id,
        p_friend_id: receiver_id
      });

    if (senderFriendUpdate.error) {
      throw senderFriendUpdate.error;
    }

    const receiverFriendUpdate = await supabase
      .rpc('append_friend', {
        p_profile_id: receiver_id,
        p_friend_id: sender_id
      });

    if (receiverFriendUpdate.error) {
      throw receiverFriendUpdate.error;
    }

    await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    res.status(200).json({ sender: senderFriendUpdate.data, receiver: receiverFriendUpdate.data });
  } catch (error) {
    console.error('Error in accept friend request endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/friend-request/reject', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { requestId } = req.body;
  try {
    const { error } = await supabase
      .from('friend_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      throw error;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error in reject friend request endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { query } = req.query;
  try {
    const usersResponse = await clerkClient.users.getUserList();
    const filteredUsers = usersResponse.data.filter(user =>
      user.username && user.username.toLowerCase().includes(query.toLowerCase())
    );
    res.json(filteredUsers);
  } catch (error) {
    console.error('Error in search endpoint:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/friends/:userId', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('friends')
      .select('friends')
      .eq('profile_id', userId)
      .single();

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error in fetch friends endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
