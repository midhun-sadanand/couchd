import React, { useEffect, useState} from 'react';
import { SignedIn, SignedOut, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import ScrollRevealText from '../components/ScrollRevealText';
import ScrollCards from '../components/ScrollCards';
import { motion, useScroll, useTransform } from 'framer-motion';

function HomePage({ showLogin, showSignup, toggleLogin, toggleSignup }) {
  const navigate = useNavigate();
  const { isSignedIn, user } = useUser();
  const { scrollYProgress } = useScroll();
  const [isVisible, setIsVisible] = useState(false);
  const pixelThreshold = 200;

  useEffect(() => {
    if (isSignedIn) {
      navigate(`/profile/${user.username}`);
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (showLogin) toggleLogin();
        if (showSignup) toggleSignup();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLogin, showSignup, toggleLogin, toggleSignup]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > pixelThreshold) { // Adjust the threshold as needed
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const initialLines = [
    "You just opened YouTube.",
    "\u00A0\u00A0\u00A0Wait, what'd you want to watch again?",
    "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Well you're already here.",
    "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Might as well keep scrolling.",
    "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0Well you are already here.",
    "\u00A0\u00A0\u00A0What did you just watch?",
    "Didn't you just open Youtube?",
  ];

  return (
    <div className="bg-[#232323] text-white min-h-screen flex flex-col items-center pt-16">
      <div className="container mx-auto mt-10 px-4">
        <div className={`relative ${showLogin || showSignup ? 'blur-bg' : ''}`}>
          <h1 className="text-6xl font-bold mb-4 text-center mt-20 fade-in-heading">
            Consume what you want, how you want.
          </h1>

          <div className="flex justify-center items-center mb-4 fade-in-heading">
            <span className="text-lg text-[#888888] mx-2">No algorithms</span>
            <div className="h-[20px] border-l border-[#888888] mx-2"></div>
            <span className="text-lg text-[#888888] mx-2">No feeds</span>
            <div className="h-[20px] border-l border-[#888888] mx-2"></div>
            <span className="text-lg text-[#888888] mx-2">No engagement loops</span>
          </div>

          <p className="text-2xl mb-2 text-[#888888] text-left fade-in-subheading fade-in">
            Experience media on your own terms
          </p>

          <p className="text-xl text-left fade-in-subheading mb-8">  
            Consumption is a means to an end. <br />
            Algorithms, autoplay, and endless feeds take advantage of human psychology to treat you as the means.
          </p>
          <p className="text-2xl mb-3 text-[#888888] text-left fade-in-subheading fade-in">
            Come back to what you want, not what an algorithm wants
          </p>
          <p className="text-xl text-left fade-in-subheading mb-8">  
            Passive consumption warps your conscious experience of the world. <br/>
            Regain the agency to actively choose what you consume.
          </p>
          {isVisible &&
          <div className="sticky top-16 pt-64">
            <span className="text-6xl">BREAK THE LOOP</span>
            <span className="pt-40"><ScrollCards /></span>
          </div>}

          {/* Add more content to make the page longer */}
          <div className="h-[600vh]"></div> {/* Spacer div to make the page longer */}
          {/*<div className="flex">
            <ScrollRevealText 
              initialLines={initialLines} 
              revealDistance={300}
              startRevealOffset={900} 
            /> {/* Use the ScrollRevealText component */}
          {/*}  <div className="text-2xl fade-in scroll-mb-40">Break the cycle.</div>
          </div>*/}
          {(showLogin || showSignup) && (
            <div
              className="backdrop"
              onClick={() => {
                if (showLogin) toggleLogin();
                if (showSignup) toggleSignup();
              }}
            ></div>
          )}

          <SignedOut>
            {showLogin && (
              <div className="form-container">
                <SignIn />
              </div>
            )}
            {showSignup && (
              <div className="form-container">
                <SignUp />
              </div>
            )}
          </SignedOut>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
