"use client";

import React from 'react';
import { User, Grid, Users, Sidebar } from '@geist-ui/icons';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLibraryToggle: () => void;
  onFriendsToggle: () => void;
  isLibraryOpen: boolean;
  isFriendsOpen: boolean;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onLibraryToggle,
  onFriendsToggle,
  isLibraryOpen,
  isFriendsOpen,
}) => {
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, action: () => onTabChange('profile') },
    { id: 'watchlists', label: 'Lists', icon: Grid, action: () => onTabChange('watchlists') },
    { id: 'friends', label: 'Friends', icon: Users, action: onFriendsToggle },
    { id: 'library', label: 'Library', icon: Sidebar, action: onLibraryToggle },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-[#171717] border-t border-[#2a2a2a] z-50 sm:hidden"
      style={{
        height: '56px',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = 
            tab.id === activeTab || 
            (tab.id === 'library' && isLibraryOpen) || 
            (tab.id === 'friends' && isFriendsOpen);

          return (
            <button
              key={tab.id}
              onClick={tab.action}
              className="flex flex-col items-center justify-center min-w-[60px] h-full relative focus:outline-none active:scale-95 transition-transform"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <Icon 
                size={24} 
                color={isActive ? '#f6f6f6' : '#777777'} 
              />
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#f6f6f6] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

