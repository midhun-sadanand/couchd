import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WatchlistWidget = ({ username, name, description, unwatchedCount, watchingCount, watchedCount, tags }) => {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const numberContainerRef = useRef(null);
  const [fontSize, setFontSize] = useState('2.5rem');

  // Ensure tags is always an array
  const tagArray = Array.isArray(tags) ? tags : [];

  useEffect(() => {
    const adjustFontSize = () => {
      const titleElement = titleRef.current;
      const numberContainerElement = numberContainerRef.current;
      if (titleElement && numberContainerElement) {
        const gap = 10; // minimum gap between title and number container
        const numberContainerWidth = numberContainerElement.offsetWidth;
        const widgetWidth = titleElement.parentElement.offsetWidth;
        const availableWidth = widgetWidth - numberContainerWidth - gap;

        let fontSize = 2.5; // Initial font size in rem
        titleElement.style.fontSize = `${fontSize}rem`;

        while (titleElement.scrollWidth > availableWidth && fontSize > 1.2) {
          fontSize -= 0.1;
          titleElement.style.fontSize = `${fontSize}rem`;
        }

        if (titleElement.scrollWidth > availableWidth) {
          titleElement.style.whiteSpace = 'normal';
        } else {
          titleElement.style.whiteSpace = 'nowrap';
        }

        setFontSize(`${fontSize}rem`);
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [name]);

  const handleClick = () => {
    navigate(`/list/${username}/${name}`);
  };

  return (
    <div onClick={handleClick} className="watchlist-widget text-[#e6e6e6] rounded-lg p-4 shadow-lg flex flex-col justify-between w-full cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col" style={{ marginTop: '5px' }}>
          <div ref={titleRef} className="title-container font-bold mr-3" style={{ fontSize, textAlign: 'left' }}>{name}</div>
          <div className="text-sm text-gray-400" style={{ textAlign: 'left', marginTop: '2px' }}>{description}</div>
        </div>
        <div className="number-container flex flex-col items-end" ref={numberContainerRef}>
          <div className="text-red-500">{unwatchedCount}</div>
          <div className="text-yellow-500">{watchingCount}</div>
          <div className="text-green-500">{watchedCount}</div>
        </div>
      </div>
      <div className="flex flex-wrap">
        {tagArray.map((tag, index) => (
          <div key={index} className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full mr-2 mb-2">
            {tag}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchlistWidget;