import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { UserButton } from '@clerk/clerk-react';
import { Bell } from '@geist-ui/icons';
import { useCachedProfileData } from '../../hooks/useCachedProfileData';
import supabase from '../../utils/supabaseClient';
import WatchlistButton from '../WatchlistButton'; // Import the new component

const ProfileHeader = () => {
  const navigate = useNavigate();
  const { signOut: clerkSignOut } = useAuth();
  const { userProfile } = useCachedProfileData();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await clerkSignOut();
    navigate('/');
  };

  const goToWatchlists = () => {
    navigate(`/profile/${userProfile.username}/lists`);
  };

  const goToProfile = () => {
    if (userProfile) {
      navigate(`/profile/${userProfile.username}`);
    }
  };

  const handleSearchClick = (query) => {
    navigate(`/search?query=${encodeURIComponent(query)}`);
  };

  const [hovered, setHovered] = useState({ home: false, grid: false, bell: false });

  return (
    <header className="text-white p-4 shadow-md bg-[#171717] fixed top-0 left-0 w-full z-50 mb-16"> {/* Added mb-16 */}
      <div className="mx-auto flex justify-between items-center" style={{ maxWidth: '85%' }}>
        <div className="my-1 mr-6">
          <h1 className="font-bold text-2xl text-left">couchd</h1>
          <h2 className="italic text-left">conscious consumption</h2>
        </div>
        <div className="flex items-center space-x-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="currentColor"
            className="size-6 cursor-pointer transition-colors duration-300"
            style={{ color: hovered.home ? '#ffffff' : '#a1a1a1', width: '28px', height: '28px'}}
            onMouseEnter={() => setHovered({ ...hovered, home: true })}
            onMouseLeave={() => setHovered({ ...hovered, home: false })}
            onClick={goToProfile}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <WatchlistButton
            onClick={goToWatchlists}
            hovered={hovered}
            setHovered={setHovered}
          />
          <Bell
            size={28}
            color={hovered.bell ? '#ffffff' : '#a1a1a1'}
            className="cursor-pointer transition-colors duration-300"
            onMouseEnter={() => setHovered({ ...hovered, bell: true })}
            onMouseLeave={() => setHovered({ ...hovered, bell: false })}
          />
          <div className="flex items-center space-x-2">
            <UserButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default ProfileHeader;
