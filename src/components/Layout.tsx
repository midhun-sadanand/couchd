"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import HomepageHeader from './HomepageHeader';
import ProfileHeader from './ProfileHeader';
import { useSupabaseClient } from '@/utils/auth';
import AuthModal from './AuthModal';

type Props = {
  children: React.ReactNode;
};

const Layout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');

  const supabase = useSupabaseClient();

  const handleAuthClick = (view: 'sign_in' | 'sign_up') => {
    setAuthView(view);
    setShowAuth(true);
  };

  // Decide which header to display based on the route
  const getHeader = () => {
    if (pathname?.startsWith('/profile') || pathname === '/lists' || pathname?.includes('/list')) {
      if (!supabase) return null; // or a loading skeleton
      return <ProfileHeader />;
    } else {
      return <HomepageHeader onSignIn={() => handleAuthClick('sign_in')} onSignUp={() => handleAuthClick('sign_up')} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {getHeader()}
      <main className="flex-grow">
        {children}
      </main>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} view={authView} />
    </div>
  );
};

export default Layout; 