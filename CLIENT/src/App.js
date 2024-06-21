import './index.css';
import './App.css';
import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { dark } from "@clerk/themes";
import Layout from './components/common/Layout';
import { SupabaseProvider } from './utils/auth';

const HomePage = lazy(() => import('./pages/HomePage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const PostSignUp = lazy(() => import('./pages/PostSignUp'));
const SearchResults = lazy(() => import('./pages/SearchResults')); // Import SearchResults

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

console.log("PUBLIC KEY", clerkPubKey);

function App() {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const toggleLogin = () => {
    setShowLogin((prev) => !prev);
    if (showSignup) setShowSignup(false);
  };

  const toggleSignup = () => {
    setShowSignup((prev) => !prev);
    if (showLogin) setShowLogin(false);
  };

  return (
    <ClerkProvider appearance={{ baseTheme: dark }} publishableKey={clerkPubKey}>
      <SupabaseProvider>
        <Router>
          <div className="App">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Layout
                      showLogin={showLogin}
                      showSignup={showSignup}
                      toggleLogin={toggleLogin}
                      toggleSignup={toggleSignup}
                    />
                  }
                >
                  <Route
                    index
                    element={
                      <HomePage
                        showLogin={showLogin}
                        showSignup={showSignup}
                        toggleLogin={toggleLogin}
                        toggleSignup={toggleSignup}
                      />
                    }
                  />
                  <Route path="signup" element={<SignupPage />} />
                  <Route path="lists" element={<WatchlistPage />} />
                  <Route path="/list/:username/:watchlistName/:watchlistId" element={<MediaPage />} />
                  <Route path="/profile/:username" element={<SignedIn><ProfilePage /></SignedIn>} />
                  <Route path="/:username" element={<SignedIn><ProfilePage /></SignedIn>} />
                  <Route path="/search" element={<SearchResults />} />  {/* Add this route */}
                </Route>
                <Route path="/" element={<SignedOut><LoginPage /></SignedOut>} />
                <Route path="/signup" element={<SignedOut><SignupPage /></SignedOut>} />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </SupabaseProvider>
    </ClerkProvider>
  );
}

export default App;
