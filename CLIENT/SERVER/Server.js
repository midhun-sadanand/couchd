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

const updateMediaItemCounters = async (watchlistId) => {
  const { data: counts, error } = await supabase
    .from('media_items')
    .select('status, count:status')
    .eq('watchlist_id', watchlistId)
    .group('status');

  if (error) {
    throw error;
  }

  const toConsumeCount = counts.find(c => c.status === 'to consume')?.count || 0;
  const consumingCount = counts.find(c => c.status === 'consuming')?.count || 0;
  const consumedCount = counts.find(c => c.status === 'consumed')?.count || 0;

  const { error: updateError } = await supabase
    .from('watchlists')
    .update({
      to_consume_count: toConsumeCount,
      consuming_count: consumingCount,
      consumed_count: consumedCount,
    })
    .eq('id', watchlistId);

  if (updateError) {
    throw updateError;
  }
};

app.put('/api/media-items/:id/status', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('media_items')
      .update({ status })
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    await updateMediaItemCounters(data.watchlist_id);

    res.json(data);
  } catch (error) {
    console.error('Error updating media item status:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/media-items/:id', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('media_items')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await updateMediaItemCounters(data.watchlist_id);

    res.json(data);
  } catch (error) {
    console.error('Error deleting media item:', error.message);
    res.status(500).json({ error: error.message });
  }
});

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

// New endpoint for fetching friend requests
app.get('/api/friend-requests', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { receiverId } = req.query;
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('receiver_id', receiverId)
      .eq('status', 'pending');

    if (error) {
      throw error;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint for creating watchlist and updating profiles table
app.post('/api/watchlists', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { watchlistName, description, tags, isPublic, userId, username } = req.body;

  try {
    // Create the watchlist
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlists')
      .insert([{ name: watchlistName, user_id: userId, description, tags, is_public: isPublic }])
      .select();

    if (watchlistError) throw watchlistError;
    const newWatchlist = watchlistData[0];

    // Insert into the watchlist ownership table
    const { error: ownershipError } = await supabase
      .from('watchlist_ownership')
      .insert([{ user_id: userId, watchlist_id: newWatchlist.id }]);

    if (ownershipError) throw ownershipError;

    res.status(201).json(newWatchlist);
  } catch (error) {
    console.error('Error creating watchlist:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/watchlists/share', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  const { watchlistId, sharedWith, userId } = req.body;

  try {
    const { data: watchlistData, error: watchlistError } = await supabase
      .from('watchlists')
      .update({ shared_with: sharedWith })
      .eq('id', watchlistId)
      .select();

    if (watchlistError) throw watchlistError;

    // Update watchlist sharing for each user
    for (const sharedUserId of sharedWith) {
      const { data: profileData, error: profileError } = await supabase
        .from('watchlist_sharing')
        .select('*')
        .eq('shared_with_user_id', sharedUserId)
        .eq('watchlist_id', watchlistId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      if (!profileData) {
        // Insert new sharing record if it doesn't exist
        const { error: insertShareError } = await supabase
          .from('watchlist_sharing')
          .insert([{ shared_with_user_id: sharedUserId, watchlist_id: watchlistId }]);

        if (insertShareError) throw insertShareError;
      }
    }

    // Remove watchlist_id from users that are no longer shared with
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('watchlist_sharing')
      .select('shared_with_user_id')
      .eq('watchlist_id', watchlistId);

    if (allProfilesError) throw allProfilesError;

    for (const profile of allProfiles) {
      if (!sharedWith.includes(profile.shared_with_user_id)) {
        const { error: deleteShareError } = await supabase
          .from('watchlist_sharing')
          .delete()
          .eq('shared_with_user_id', profile.shared_with_user_id)
          .eq('watchlist_id', watchlistId);

        if (deleteShareError) throw deleteShareError;
      }
    }

    res.status(200).json({ message: 'Watchlist shared/unshared successfully' });
  } catch (error) {
    console.error('Error sharing/unsharing watchlist:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
