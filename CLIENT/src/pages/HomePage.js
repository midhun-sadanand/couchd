import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import MovieCard from '../components/common/MovieCard';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

function HomePage({ showLogin, showSignup, toggleLogin, toggleSignup }) {
  const [media, setMovies] = useState([]);
  const loginFormRef = useRef(null);
  const signupFormRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (loginFormRef.current && !loginFormRef.current.contains(event.target)) {
        if (showLogin) toggleLogin();
      }
      if (signupFormRef.current && !signupFormRef.current.contains(event.target)) {
        if (showSignup) toggleSignup();
      }
    };

    if (showLogin || showSignup) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLogin, showSignup]);

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="relative">
        {showLogin && (
          <div
            ref={loginFormRef}
            className="form-container"
            onMouseDown={(e) => e.stopPropagation()} // Prevents form from closing when clicking inside
          >
            <LoginPage />
          </div>
        )}
        {showSignup && (
          <div
            ref={signupFormRef}
            className="form-container"
            onMouseDown={(e) => e.stopPropagation()} // Prevents form from closing when clicking inside
          >
            <SignupPage />
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
