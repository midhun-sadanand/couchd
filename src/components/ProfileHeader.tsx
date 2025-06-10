// ProfileHeader.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Clock from './Clock';
import Logo from './Logo';

const ProfileHeader: React.FC = () => {
  const [translateY, setTranslateY] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);

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

  return (
    <header className="bg-transparent text-white pl-6 pt-3 pb-3 md:p-3 lg:py-3 lg:px-14 fixed top-0 left-0 w-full z-50" style={{height: '3.5rem', minHeight: '3.5rem'}}>
      <motion.div
        animate={{ y: translateY }}
        transition={{ duration: .6, ease: 'easeInOut', delay:.04}}
        className="w-full mx-auto flex items-center relative"
      >
        <div className="flex items-center md:ml-2">
          <div className="mr-2 md:mr-3"><Logo scale={.15} color="gray"/></div>
          <h1 className="font-eina-bold font-bold text-xl my-1 mr-2 md:text-xl lg:text-2xl text-left text-[#888888]">couchd</h1>
        </div>
        <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
          <Clock />
        </div>
      </motion.div>
    </header>
  );
};

export default ProfileHeader;
