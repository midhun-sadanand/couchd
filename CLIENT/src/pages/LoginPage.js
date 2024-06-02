import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import supabase from '../utils/supabaseClient';

const CustomSignIn = () => {
  const navigate = useNavigate();

  const handleSignIn = async (user) => {
    const { id, emailAddresses } = user;
    const email = emailAddresses[0].emailAddress;

    // Perform additional actions if needed
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (error) {
      console.error("Database fetch error:", error.message);
    } else {
      console.log('Login successful:', data);
      navigate(`/profile/${data.username}`);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
      <SignIn afterSignIn={handleSignIn} />
    </div>
  );
};

export default CustomSignIn;
