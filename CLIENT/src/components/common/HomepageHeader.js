import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

const transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

function Header({ toggleLogin, toggleSignup, showLogin, showSignup }) {
  const { signOut } = useAuth();
  const [hovered, setHovered] = useState(null);

  return (
    <header className="bg-[#171717] text-white p-4 shadow-md relative">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="my-1 mr-6">
            <h1 className="font-bold text-2xl text-left text-[#888888]">couchd</h1>
            <h2 className="italic text-left text-[#888888]">conscious consumption</h2>
          </div>
        </div>
        <nav className="flex items-center">
          <SignedOut>
            <motion.button
              onClick={(e) => {
                toggleLogin();
                e.stopPropagation();
              }}
              className={`btn ${showLogin ? 'bg-stone-500 text-white' : ''}`}
              onHoverStart={() => setHovered('login')}
              onHoverEnd={() => setHovered(null)}
              animate={{ x: hovered === 'login' ? 5 : 0 }}
              transition={transition}
            >
              Login
            </motion.button>
            <motion.button
              onClick={(e) => {
                toggleSignup();
                e.stopPropagation();
              }}
              className={`ml-2 btn ${showSignup ? 'bg-stone-600 text-white' : ''}`}
              onHoverStart={() => setHovered('register')}
              onHoverEnd={() => setHovered(null)}
              animate={{ x: hovered === 'register' ? -5 : 0 }}
              transition={transition}
            >
              Register
            </motion.button>
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}

export default Header;
