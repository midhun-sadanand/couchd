"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import HomepageHeader from './HomepageHeader';
import ProfileHeader from './ProfileHeader';
import { SignedOut, SignIn, SignUp } from '@clerk/nextjs';
import { useSupabaseClient } from '@/utils/auth';

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const supabase = useSupabaseClient();

  const toggleLogin = () => setShowLogin(!showLogin);
  const toggleSignup = () => setShowSignup(!showSignup);

  // Decide which header to display based on the route
  const getHeader = () => {
    if (pathname?.startsWith('/profile') || pathname === '/lists' || pathname?.includes('/list')) {
      if (!supabase) return null; // or a loading skeleton
      return <ProfileHeader />;
    } else {
      return <HomepageHeader toggleLogin={toggleLogin} toggleSignup={toggleSignup} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {getHeader()}
      <main className="flex-grow">
        {children}
      </main>
      {/* Render the Clerk components when showLogin or showSignup is true */}
      {(showLogin || showSignup) && (
        <div
          className="backdrop"
          onClick={() => {
            if (showLogin) setShowLogin(false);
            if (showSignup) setShowSignup(false);
          }}
        ></div>
      )}
      <SignedOut>
        {showLogin && (
          <div className="form-container">
            <SignIn routing="hash" />
          </div>
        )}
        {showSignup && (
          <div className="form-container">
            <SignUp routing="hash" />
          </div>
        )}
      </SignedOut>
    </div>
  );
};

export default Layout; 