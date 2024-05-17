import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import MovieCard from './MovieCard';
import LoginPage from './LoginPage';
import SignupPage from './SignupPage';

function HomePage({ showLogin, showSignup, toggleLogin, toggleSignup }) {
  const [media, setMovies] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [disableOutsideClick, setDisableOutsideClick] = useState(false);

  const loginFormRef = useRef(null);
  const signupFormRef = useRef(null);



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (disableOutsideClick) return;

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
  }, [showLogin, showSignup, disableOutsideClick]);

  return (
    <div className="container mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter title"
            className="h-10 border border-gray-300 p-2 rounded bg-gray-100 focus:outline-none focus:ring focus:border-blue-300"
          />
          <button className="text-white ml-2 inline-block bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded">
            Add Medium
          </button>
        </div>
      </div>
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
