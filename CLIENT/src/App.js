// App.js
import './index.css';
import './App.css';
import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/common/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));

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
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
