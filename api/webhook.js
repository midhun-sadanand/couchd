// api/webhook.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { data: { id: clerkId, emailAddress, username } } = req.body;

      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { clerk_id: clerkId, email: emailAddress, username: username }
        ]);

      if (error) {
        console.error('Error inserting data:', error);
        return res.status(500).json({ error: 'Failed to insert data into Supabase' });
      }

      return res.status(200).json({ data: 'Profile created successfully' });
    } catch (error) {
      console.error('Error handling request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
