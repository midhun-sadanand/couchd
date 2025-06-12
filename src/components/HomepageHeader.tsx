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
    <header className="bg-transparent text-white fixed top-1 left-1 w-full z-50" style={{height: '3.5rem', minHeight: '3.5rem', paddingLeft: 0, paddingRight: 0}}>
      <motion.div 
        animate={{ y: translateY }}
        transition={{ duration: .6, ease: 'easeInOut', delay:.04}}
        className="w-full flex items-center relative"
      >
        <div className="flex items-center cursor-pointer select-none" style={{marginLeft: '0.75rem'}}>
          <div className="mr-2"><Logo scale={.15} color="gray"/></div>
          <h1 className="font-eina-bold font-bold text-xl my-1 mr-2 text-left text-[#888888]">couchd</h1>
        </div>
        <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)'}}>
          <Clock />
        </div>
        <nav className="flex items-center absolute" style={{right: '1.5rem', top: '50%', transform: 'translateY(-50%)'}}>
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