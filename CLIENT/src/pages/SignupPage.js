import React from 'react';
import { SignUp } from '@clerk/clerk-react';

const SignUpPage = () => {
  return (
    <div className="signup-page">
      <SignUp path="/sign-up" redirectUrl="/post-signup" />
    </div>
  );
};

export default SignUpPage;



// import React from 'react';
// import { SignUp } from '@clerk/clerk-react';
// import supabase from '../supabaseClient';

// const CustomSignUp = () => {

//   const handleSignUp = async (user) => {
//     const { id, emailAddresses } = user;
//     const email = emailAddresses[0].emailAddress;

//     // Save additional user information to Supabase
//     const { error: insertError } = await supabase
//       .from('profiles')
//       .insert([
//         { user_id: id, email: email }
//       ]);

//     if (insertError) {
//       console.error("Database insertion error:", insertError.message);
//     } else {
//       console.log('Signup and profile creation successful:', user);
//     }
//   };

//   return (
//     <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
//       <SignUp afterSignUp={handleSignUp} />
//     </div>
//   );
// };

// export default CustomSignUp;
