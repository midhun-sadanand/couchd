import './index.css';
import './App.css';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { dark } from "@clerk/themes";
import Layout from './components/common/Layout';
import { SupabaseProvider } from './utils/auth';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { fetchWatchlists } from './hooks/useWatchlists'; // Import the fetch function
import { useCachedProfileData } from './hooks/useCachedProfileData'; // Import the new hook

const LandingPage = lazy(() => import('./pages/LandingPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const PostSignUp = lazy(() => import('./pages/PostSignUp'));
const SearchResults = lazy(() => import('./pages/SearchResults'));
const ActivityPage = lazy(() => import('./components/ActivityTab'));

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

console.log("PUBLIC KEY", clerkPubKey);

const AppContent = ({ showLogin, showSignup, toggleLogin, toggleSignup }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const queryClient = useQueryClient();
  useCachedProfileData(); // Use the new hook

  useEffect(() => {
    if (isLoaded && clerkUser) {
      queryClient.prefetchQuery(['watchlists', clerkUser.id], () => fetchWatchlists({ queryKey: ['watchlists', clerkUser.id] }));
    }
  }, [clerkUser, isLoaded, queryClient]);

  return (
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
                element={<LandingPage />
                }
              />
              <Route path="signup" element={<SignupPage />} />
              <Route path="/profile/:username/lists" element={<WatchlistPage />} />
              <Route path="/profile/:username/activity" element={<ActivityPage />} />
              <Route path="/list/:username/:watchlistName/:watchlistId" element={<MediaPage />} />
              <Route path="/profile/:username" element={<SignedIn><ProfilePage /></SignedIn>} />
              <Route path="/:username" element={<SignedIn><ProfilePage /></SignedIn>} />
              <Route path="/search" element={<SearchResults />} />
            </Route>
            <Route path="/" element={<SignedOut><LoginPage /></SignedOut>} />
            <Route path="/signup" element={<SignedOut><SignupPage /></SignedOut>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

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

  const queryClient = new QueryClient();

  return (
    <ClerkProvider appearance={{ baseTheme: dark }} publishableKey={clerkPubKey}>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider>
          <AppContent
            showLogin={showLogin}
            showSignup={showSignup}
            toggleLogin={toggleLogin}
            toggleSignup={toggleSignup}
          />
        </SupabaseProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
