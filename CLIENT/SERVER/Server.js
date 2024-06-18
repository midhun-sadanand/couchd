require('dotenv').config();
const express = require('express');
const { ClerkExpressRequireAuth, clerkClient } = require('@clerk/clerk-sdk-node');
const cors = require('cors');

console.log("Environment Variables:");
console.log("CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY);

const app = express();
app.use(cors({ origin: 'http://localhost:3000' })); // Allow requests from React app
app.use(express.json());

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
console.log("SECRET KEY:", clerkSecretKey);

if (!clerkSecretKey) {
  console.error('Missing Clerk secret key');
  process.exit(1);
}

// Example endpoint with ClerkExpressRequireAuth middleware
app.get('/api/users', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  try {
    
    const usersResponse = await clerkClient.users.getUserList();
    console.log('Raw users response:', usersResponse); // Log the raw response

    if (usersResponse.errors) {
      throw new Error(usersResponse.errors.map(err => err.message).join(', '));
    }

    console.log('Formatted users response:', usersResponse);
    res.json(usersResponse);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/:userId', ClerkExpressRequireAuth({ secretKey: clerkSecretKey }), async (req, res) => {
  try {
    const { userId } = req.params;
    const userResponse = await clerkClient.users.getUser(userId);
    if (userResponse.errors) {
      throw new Error(userResponse.errors.map(err => err.message).join(', '));
    }
    res.json(userResponse);
  } catch (error) {
    console.error('Error fetching user:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
