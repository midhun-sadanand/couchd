import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './HomepageHeader';
import ProfileHeader from './ProfileHeader';  // Ensure this is imported correctly
import Footer from './Footer';

const Layout = ({ showLogin, showSignup, toggleLogin, toggleSignup }) => {
  const location = useLocation();  // This hook gives you the current route location

  // Decide which header to display based on the route
  const getHeader = () => {
    if (location.pathname === '/profile' || location.pathname === '/lists' || location.pathname.includes('/list')) {
      return <ProfileHeader />;  // Profile page gets a special header
    } else {
      return <Header toggleLogin={toggleLogin} toggleSignup={toggleSignup} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {getHeader()} 
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
