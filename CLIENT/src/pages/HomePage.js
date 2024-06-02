import React, { useEffect } from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

function HomePage({ showLogin, showSignup, toggleLogin, toggleSignup }) {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) {
      navigate('/profile');
    }
  }, [isSignedIn, navigate]);

  return (
    <div className={`bg-[#232323] text-white min-h-screen relative flex items-center justify-center`}>
      <div className="container mx-auto mt-10 px-4">
        <div className={`relative ${showLogin || showSignup ? 'blur-bg' : ''}`}>
          {(showLogin || showSignup) && (
            <div className="backdrop" onClick={() => {
              if (showLogin) toggleLogin();
              if (showSignup) toggleSignup();
            }}></div>
          )}

          <SignedOut>
            {showLogin && (
              <div className="form-container">
                <SignIn />
              </div>
            )}
            {showSignup && (
              <div className="form-container">
                <SignUp />
              </div>
            )}
          </SignedOut>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
