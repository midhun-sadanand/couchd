import React, { useState, useEffect } from 'react';

const HorizontalScroll = ({ children, dir }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const verticalOffset = window.scrollY;
      setOffset((verticalOffset - 3100) / (dir * 2)); // Adjust the division factor to control the speed of the horizontal sliding
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="scroll-container">
      <div className="slide-element" style={{ transform: `translateX(${offset}px)` }}>
        {children}
      </div>
    </div>
  );
};


export default HorizontalScroll;