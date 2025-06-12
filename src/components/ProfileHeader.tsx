// ProfileHeader.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Clock from './Clock';
import Logo from './Logo';
import { User, Grid, Users } from '@geist-ui/icons';
import { usePathname, useRouter } from 'next/navigation';

interface ProfileHeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  friendsSidebarOpen: boolean;
  setFriendsSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  sidebarOpen,
  setSidebarOpen,
  friendsSidebarOpen,
  setFriendsSidebarOpen,
  activeTab,
  setActiveTab,
}) => {
  const [translateY, setTranslateY] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <header className="bg-transparent text-white fixed top-1 left-1 w-full z-50" style={{height: '3.5rem', minHeight: '3.5rem', paddingLeft: 0, paddingRight: 0}}>
      <motion.div
        animate={{ y: translateY }}
        transition={{ duration: .6, ease: 'easeInOut', delay:.04}}
        className="w-full flex items-center relative"
      >
        <div className="flex items-center cursor-pointer select-none" style={{marginLeft: '0.75rem'}} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div className="mr-2"><Logo scale={.15} color="gray"/></div>
          <h1 className="font-eina-bold font-bold text-xl my-1 mr-2 text-left text-[#888888]">couchd</h1>
        </div>
        <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
          <Clock />
        </div>
        <div className="flex items-center space-x-6 absolute" style={{right: '1.5rem', top: '50%', transform: 'translateY(-50%)'}}>
          <button onClick={handleProfileClick} className="focus:outline-none">
            <User size={28} color={activeTab === 'profile' ? '#f6f6f6' : '#777777'} />
          </button>
          <button onClick={handleWidgetClick} className="focus:outline-none">
            <Grid size={28} color={isWatchlistsPage && activeTab === 'watchlists' ? '#f6f6f6' : '#777777'} />
          </button>
          <button onClick={() => setFriendsSidebarOpen(!friendsSidebarOpen)} className="focus:outline-none">
            <Users size={28} color={friendsSidebarOpen ? '#f6f6f6' : '#777777'} />
          </button>
        </div>
      </motion.div>
    </header>
  );
};

export default ProfileHeader;
