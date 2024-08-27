import React, { useRef, useState, useEffect } from 'react';
import LandingPage from './LandingPage';

const ScrolledLanding = () => {
    const scrollableRef = useRef(null);
    const [velocity, setVelocity] = useState(0);
    const friction = 0.99; // Even lower friction for a more exaggerated effect
    const sensitivity = 4.0; // Higher sensitivity
  
    useEffect(() => {
      const handleWheel = (e) => {
        setVelocity((prevVelocity) => prevVelocity + e.deltaY * sensitivity);
      };
  
      const applyMomentum = () => {
        if (scrollableRef.current) {
          if (Math.abs(velocity) > 0.1) {
            scrollableRef.current.scrollTop += velocity;
            setVelocity((prevVelocity) => prevVelocity * friction);
          } else {
            setVelocity(0);
          }
          requestAnimationFrame(applyMomentum);
        }
      };
  
      const scrollableElement = scrollableRef.current;
      if (scrollableElement) {
        scrollableElement.addEventListener('wheel', handleWheel);
      }
      applyMomentum();
  
      return () => {
        if (scrollableElement) {
          scrollableElement.removeEventListener('wheel', handleWheel);
        }
      };
    }, [velocity, sensitivity, friction]);
  
    return (
      <div ref={scrollableRef} className="scrollable scroll-smooth">
        <div className="content"><LandingPage /></div>
      </div>
    );
  };
  
  
  export default ScrolledLanding;