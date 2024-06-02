const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(bodyParser.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.post('/webhooks/clerk', async (req, res) => {
  const { data, type } = req.body;

  if (type === 'user.created') {
    const userId = data.id;
    const email = data.email_addresses[0].email_address;
    const username = data.username;

    const { error } = await supabase
      .from('profiles')
      .insert([{ user_id: userId, username, email }]);

    if (error) {
      console.error("Database insertion error:", error.message);
      return res.status(500).send('Error inserting user into database');
    }

    console.log('User inserted successfully:', data);
  }

  res.status(200).send('Webhook received');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
