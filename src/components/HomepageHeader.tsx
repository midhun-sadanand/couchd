import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Clock from './Clock';
import Logo from './Logo';
import { useUser } from '@/utils/auth';
import HeaderTabs from './HeaderTabs';
import { useHeaderTabs } from './useHeaderTabs';

interface Props {
  onSignIn: () => void;
  onSignUp: () => void;
}

const HomepageHeader: React.FC<Props> = ({ onSignIn, onSignUp }) => {
  const [translateY, setTranslateY] = useState(0);
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const { user, loading } = useUser();

  const tabs = [
    {
      label: 'Sign In',
      id: 'signin',
      onClick: onSignIn
    },
    {
      label: 'Register',
      id: 'register',
      onClick: onSignUp
    }
  ];

  const { tabProps } = useHeaderTabs(tabs);

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
    <header className="bg-transparent text-white pl-6 pt-3 pb-3 md:p-3 lg:py-3 lg:px-14 fixed top-0 left-0 w-full z-50">
      <motion.div 
        animate={{ y: translateY }}
        transition={{ duration: .6, ease: 'easeInOut', delay:.04}}
        className="w-full mx-auto flex justify-between items-center"
      >
        <div>
          <div className="flex items-center md:ml-2">
            <div className="mr-2 md:mr-3"><Logo scale={.15} color="gray"/></div>
            <h1 className="font-eina-bold font-bold text-xl my-1 mr-2 md:text-xl lg:text-2xl text-left text-[#888888]">couchd</h1>
          </div>
        </div>
        <Clock />
        <nav className="flex items-center">
          {!loading && !user && (
            <div className="text-[#888888]">
              <HeaderTabs {...tabProps} />
            </div>
          )}
        </nav>
      </motion.div>
    </header>
  );
};

export default HomepageHeader; 