// src/components/common/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ showLogin, showSignup, toggleLogin, toggleSignup }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header toggleLogin={toggleLogin} toggleSignup={toggleSignup} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
