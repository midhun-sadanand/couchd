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
    fetchMovies();
  }, []);

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

  const fetchMovies = async () => {
    const { data, error } = await supabase.from('media').select();
    if (error) console.log('Error fetching media:', error);
    else setMovies(data);
  };

  const addMovie = async () => {
    const { data, error } = await supabase
      .from('media')
      .insert([{ title: newTitle }]);
    if (error) console.log('Error adding movie:', error);
    else setMovies([...media, data[0]]);
    setNewTitle('');
  };

  const removeMovie = async (id) => {
    const { error } = await supabase
      .from('media')
      .delete()
      .match({ id });
    if (error) console.log('Error removing movie:', error);
    else setMovies(media.filter(movie => movie.id !== id));
  };

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
          <button onClick={addMovie} className="text-white ml-2 inline-block bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        {media.map((movie) => (
          <MovieCard key={movie.id} {...movie} onRemove={removeMovie} />
        ))}
      </div>
    </div>
  );
}

export default HomePage;
