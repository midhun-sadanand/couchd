// ProfileHeader.tsx
"use client";

import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import Clock from './Clock';
import Logo from './Logo';
import { User, Grid, Users } from '@geist-ui/icons';
import { usePathname, useRouter } from 'next/navigation';
import { ProfileUIContext } from './Layout';

interface ProfileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  friendsSidebarOpen: boolean;
  setFriendsSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobile?: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  friendsSidebarOpen,
  setFriendsSidebarOpen,
  activeTab,
  setActiveTab,
  isMobile = false,
}) => {
  const [translateY, setTranslateY] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [iconSize, setIconSize] = useState(28);
  const pathname = usePathname();
  const router = useRouter();
  const { setSelectedMedia } = useContext(ProfileUIContext);

  // Update icon size based on window width
  useEffect(() => {
    const updateIconSize = () => {
      const width = window.innerWidth;
      if (width < 640) setIconSize(22);
      else if (width < 1024) setIconSize(24);
      else setIconSize(28);
    };
    updateIconSize();
    window.addEventListener('resize', updateIconSize);
    return () => window.removeEventListener('resize', updateIconSize);
  }, []);

  const handleScroll = () => {
    const currentScroll = window.scrollY || document.documentElement.scrollTop;
    if (currentScroll > lastScrollTop) {
      setTranslateY(-100);
    } else {
      setTranslateY(0);
    }
    setLastScrollTop(currentScroll);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollTop]);

  const handleLogoClick = () => {
    setActiveTab('profile');
    setSelectedMedia(null);
    if (pathname?.startsWith('/watchlist')) {
      router.back();
    }
  };

  const handleProfileClick = () => {
    if (pathname?.startsWith('/watchlist')) {
      setActiveTab('profile');
      router.back();
    } else {
      setActiveTab('profile');
    }
  };

  const handleWidgetClick = () => {
    if (pathname?.startsWith('/watchlist')) {
      setActiveTab('watchlists');
      router.back();
    } else {
      setActiveTab('watchlists');
    }
  };

  const isWatchlistsPage = pathname?.startsWith('/profile') || pathname === '/lists' || pathname?.includes('/list');
  const headerHeight = isMobile ? '2.5rem' : '3.5rem';

  return (
    <header className="bg-transparent text-white fixed top-1 left-1 w-full z-50" style={{height: headerHeight, minHeight: headerHeight, paddingLeft: 0, paddingRight: 0}}>
      <motion.div
        animate={{ y: translateY }}
        transition={{ duration: .6, ease: 'easeInOut', delay:.04}}
        className="w-full flex items-center relative px-2"
      >
        <div className="flex items-center cursor-pointer select-none" onClick={handleLogoClick}>
          <div className="mr-1 sm:mr-2"><Logo scale={isMobile ? 0.10 : (iconSize < 24 ? 0.12 : 0.15)} color="gray"/></div>
          <h1 className="font-eina-bold font-bold text-sm sm:text-base lg:text-xl my-1 mr-2 text-left text-[#888888]">couchd</h1>
        </div>
        {!isMobile && (
          <div className="hidden sm:block" style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
            <Clock />
          </div>
        )}
        {!isMobile && (
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6 absolute" style={{right: '1.5rem', top: '50%', transform: 'translateY(-50%)'}}>
            <button onClick={handleProfileClick} className="focus:outline-none transition-transform hover:scale-110">
              <User size={iconSize} color={activeTab === 'profile' ? '#f6f6f6' : '#777777'} />
            </button>
            <button onClick={handleWidgetClick} className="focus:outline-none transition-transform hover:scale-110">
              <Grid size={iconSize} color={isWatchlistsPage && activeTab === 'watchlists' ? '#f6f6f6' : '#777777'} />
            </button>
            <button onClick={() => setFriendsSidebarOpen(!friendsSidebarOpen)} className="focus:outline-none transition-transform hover:scale-110">
              <Users size={iconSize} color={friendsSidebarOpen ? '#f6f6f6' : '#777777'} />
            </button>
          </div>
        )}
      </motion.div>
    </header>
  );
};

export default ProfileHeader;
