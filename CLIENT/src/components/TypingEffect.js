import React, { useState, useEffect } from 'react';

const TypingEffect = ({ text, speed }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
  
    useEffect(() => {
      if (currentIndex < text.length) {
        const timeoutId = setTimeout(() => {
          setDisplayedText((prev) => prev + text[currentIndex]);
          setCurrentIndex(currentIndex + 1);
        }, speed);
        return () => clearTimeout(timeoutId);
      }
    }, [currentIndex, text, speed]);
  
    return (
      <div>
        <span>{displayedText}</span>
        <span className={`cursor ${currentIndex >= text.length - 1 ? 'blink' : ''}`}
              >|</span>
      </div>
    );
  };
  
  export default TypingEffect;