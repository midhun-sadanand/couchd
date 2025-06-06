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

  const supabase = useSupabaseClient();

  // Decide which header to display based on the route
  const getHeader = () => {
    if (pathname?.startsWith('/profile') || pathname === '/lists' || pathname?.includes('/list')) {
      if (!supabase) return null; // or a loading skeleton
      return <ProfileHeader />;
    } else {
      return <HomepageHeader toggleAuth={() => setShowAuth(true)} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {getHeader()}
      <main className="flex-grow">
        {children}
      </main>
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default Layout; 