import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';

function Header({ toggleLogin, toggleSignup, showLogin, showSignup }) {
  const { signOut } = useAuth();

  return (
    <header className="bg-[#171717] text-white p-4 shadow-md relative">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="my-1 mr-6">
            <h1 className="font-bold text-2xl text-left">couchd</h1>
            <h2 className="italic text-left">conscious consumption</h2>
          </div>
        </div>
        <nav className="flex items-center">
          <SignedOut>
            <button
              onClick={(e) => {
                toggleLogin();
                e.stopPropagation();
              }}
              className={`text-white btn shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] hover:translate-y-1 transition-all inline-block p-2 ml-4 bg-stone-400 hover:bg-stone-500 rounded ${showLogin ? 'bg-stone-500' : ''}`}
            >
              Login
            </button>
            <button
              onClick={(e) => {
                toggleSignup();
                e.stopPropagation();
              }}
              className={`btn shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] hover:translate-y-1 transition-all inline-block p-2 ml-4 bg-stone-500 hover:bg-stone-600 rounded ${showSignup ? 'bg-stone-600' : ''}`}
            >
              Register
            </button>
          </SignedOut>
          <SignedIn>
            <button
              onClick={signOut}
              className="btn shadow-[0_9px_0_rgb(0,0,0)] hover:shadow-[0_4px_0px_rgb(0,0,0)] hover:translate-y-1 transition-all inline-block p-2 ml-4 bg-red-500 hover:bg-red-600 rounded"
            >
              Sign Out
            </button>
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}

export default Header;
