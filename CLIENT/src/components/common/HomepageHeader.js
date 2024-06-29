import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { useHeaderTabs } from './useHeaderTabs.tsx';
import HeaderTabs from './HeaderTabs.tsx';

function Header({ toggleLogin, toggleSignup }) {
  const { signOut } = useAuth();

  const tabs = [
    {
      label: "Login",
      id: "login",
      onClick: () => toggleLogin(),
    },
    {
      label: "Register",
      id: "register",
      onClick: () => toggleSignup(),
    },
  ];

  const { tabProps } = useHeaderTabs(tabs);

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
            <HeaderTabs {...tabProps} />
          </SignedOut>
        </nav>
      </div>
    </header>
  );
}

export default Header;
