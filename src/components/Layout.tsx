"use client";

import React, { useState, createContext } from 'react';
import { usePathname } from 'next/navigation';
import HomepageHeader from './HomepageHeader';
import ProfileHeader from './ProfileHeader';
import { useSupabaseClient } from '@/utils/auth';
import AuthModal from './AuthModal';

type Props = {
  children: React.ReactNode;
};

// Sidebar/Tab context
export const ProfileUIContext = createContext({
  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => {},
  friendsSidebarOpen: false,
  setFriendsSidebarOpen: (open: boolean) => {},
  activeTab: 'profile',
  setActiveTab: (tab: string) => {},
});

const Layout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');

  // Sidebar/tab state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const supabase = useSupabaseClient();

  const handleAuthClick = (view: 'sign_in' | 'sign_up') => {
    setAuthView(view);
    setShowAuth(true);
  };

  // Decide which header to display based on the route
  const getHeader = () => {
    if (
      pathname?.startsWith('/profile') ||
      pathname === '/lists' ||
      pathname?.includes('/list') ||
      pathname?.startsWith('/watchlist')
    ) {
      if (!supabase) return null; // or a loading skeleton
      return (
        <ProfileHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          friendsSidebarOpen={friendsSidebarOpen}
          setFriendsSidebarOpen={setFriendsSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      );
    } else {
      return <HomepageHeader onSignIn={() => handleAuthClick('sign_in')} onSignUp={() => handleAuthClick('sign_up')} />;
    }
  };

  return (
    <ProfileUIContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      friendsSidebarOpen,
      setFriendsSidebarOpen,
      activeTab,
      setActiveTab,
    }}>
      <div className="flex flex-col min-h-screen">
        {getHeader()}
        <main className="flex-grow">
          {children}
        </main>
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} view={authView} />
      </div>
    </ProfileUIContext.Provider>
  );
};

export default Layout; 