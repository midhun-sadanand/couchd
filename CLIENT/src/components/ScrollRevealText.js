import React, { useEffect, useState } from 'react';

const ScrollRevealText = ({ initialLines, revealDistance, startRevealOffset}) => {
  const [lines, setLines] = useState(initialLines);
  const [visibleLineIndex, setVisibleLineIndex] = useState(-1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      if (scrollTop > startRevealOffset) {
        const newIndex = Math.floor((scrollTop - startRevealOffset) / revealDistance);
        if (newIndex < lines.length && newIndex >= 0) {
          setVisibleLineIndex(newIndex);
        }
      } else {
        setVisibleLineIndex(-1); // Reset to the first line when scrolled back to the top
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lines.length, revealDistance, startRevealOffset]);

  return (
    <div className="fixed-text-container h-1/2">
      {lines.map((line, index) => (
        <p
          key={index}
          className={`fixed-text text-black ${index <= visibleLineIndex  ? 'vis ' : ''} ${index > visibleLineIndex ? 'invis' : ''}`}
        >
          {line}
        </p>
      ))}
    </div>
  );
};

export default ScrollRevealText;
