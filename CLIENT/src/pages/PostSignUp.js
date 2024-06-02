import React, { useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const PostSignUp = () => {
  const { isLoaded, user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) {
      const insertProfile = async () => {
        const userId = user.id;
        const email = user.primaryEmailAddress.emailAddress;
        const username = user.username; // Adjust based on your Clerk setup

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            { user_id: userId, username: username, email: email }
          ]);

        if (insertError) {
          console.error("Database insertion error:", insertError.message);
          // Handle error (e.g., show a notification or redirect to an error page)
        } else {
          console.log('Signup and profile creation successful:', user);
          navigate(`/profile/${username}`); // Navigate to user profile page
        }
      };

      insertProfile();
    }
  }, [isLoaded, user, navigate]);

  return (
    <div>
      <p>Loading...</p>
    </div>
  );
};

export default PostSignUp;