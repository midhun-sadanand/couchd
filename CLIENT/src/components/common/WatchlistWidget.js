import React, { useEffect, useRef, useState } from 'react';

const WatchlistWidget = ({ name, unwatchedCount, watchingCount, watchedCount }) => {
  const titleRef = useRef(null);
  const [fontSize, setFontSize] = useState('2.5rem');

  useEffect(() => {
    const adjustFontSize = () => {
      const element = titleRef.current;
      if (element) {
        let fontSize = 2.5; // Initial font size in rem
        element.style.fontSize = `${fontSize}rem`;

        while (element.scrollWidth > element.clientWidth && fontSize > 1) {
          fontSize -= 0.1;
          element.style.fontSize = `${fontSize}rem`;
        }

        setFontSize(`${fontSize}rem`);
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [name]);

  return (
    <div className="watchlist-widget text-[#e6e6e6] rounded-lg p-4 shadow-lg flex flex-col justify-between w-full">
      <div ref={titleRef} className="title-container font-bold mb-2" style={{ fontSize }}>{name}</div>
      <div className="flex justify-between items-center">
        <div className="flex flex-col items-center">
          <div className="text-2xl text-red-500">{unwatchedCount}</div>
          <div className="text-sm text-gray-400">Unwatched</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl text-yellow-500">{watchingCount}</div>
          <div className="text-sm text-gray-400">Watching</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl text-green-500">{watchedCount}</div>
          <div className="text-sm text-gray-400">Watched</div>
        </div>
      </div>
    </div>
  );
};

export default WatchlistWidget;
