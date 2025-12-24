"use client";

import React, { useState, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import HomepageHeader from './HomepageHeader';
import ProfileHeader from './ProfileHeader';
import MobileBottomNav from './MobileBottomNav';
import { useSupabaseClient } from '@/utils/auth';
import AuthModal from './AuthModal';
import { MediaItem } from '@/types';
import { useRealtimeUpdates } from '@/hooks/useRealtimeSubscriptions';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

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
  selectedMedia: null as MediaItem | null,
  setSelectedMedia: (item: MediaItem | null) => {},
  isMobile: false,
});

const Layout: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const [showAuth, setShowAuth] = useState(false);
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>('sign_in');

  // Sidebar/tab state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [friendsSidebarOpen, setFriendsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const supabase = useSupabaseClient();
  const { isMobile } = useMobileDetection();
  
  // Enable realtime updates for critical data
  useRealtimeUpdates();

  // Swipe gestures for mobile drawers
  const showProfilePages = pathname?.startsWith('/profile') || pathname === '/lists' || pathname?.includes('/list') || pathname?.startsWith('/watchlist');
  
  useSwipeGesture(
    {
      onSwipeRight: () => {
        if (isMobile && showProfilePages && !sidebarOpen && !friendsSidebarOpen) {
          setSidebarOpen(true);
        }
      },
      onSwipeLeft: () => {
        if (isMobile && showProfilePages && !friendsSidebarOpen && !sidebarOpen) {
          setFriendsSidebarOpen(true);
        } else if (isMobile && sidebarOpen) {
          setSidebarOpen(false);
        } else if (isMobile && friendsSidebarOpen) {
          setFriendsSidebarOpen(false);
        }
      },
    },
    {
      requireEdgeStart: true,
      edgeThreshold: 30,
      threshold: 50,
    }
  );

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
          isMobile={isMobile}
        />
      );
    } else {
      return <HomepageHeader onSignIn={() => handleAuthClick('sign_in')} onSignUp={() => handleAuthClick('sign_up')} />;
    }
  };

  const showMobileNav = isMobile && (
    pathname?.startsWith('/profile') ||
    pathname === '/lists' ||
    pathname?.includes('/list') ||
    pathname?.startsWith('/watchlist')
  );

  return (
    <ProfileUIContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      friendsSidebarOpen,
      setFriendsSidebarOpen,
      activeTab,
      setActiveTab,
      selectedMedia,
      setSelectedMedia,
      isMobile,
    }}>
      <div className="flex flex-col min-h-screen" style={{ paddingBottom: showMobileNav ? '56px' : '0' }}>
        {getHeader()}
        <main className="flex-grow">
          {children}
        </main>
        {showMobileNav && (
          <MobileBottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLibraryToggle={() => setSidebarOpen(!sidebarOpen)}
            onFriendsToggle={() => setFriendsSidebarOpen(!friendsSidebarOpen)}
            isLibraryOpen={sidebarOpen}
            isFriendsOpen={friendsSidebarOpen}
          />
        )}
        <AuthModal open={showAuth} onClose={() => setShowAuth(false)} view={authView} />
      </div>
    </ProfileUIContext.Provider>
  );
};

export default Layout; 