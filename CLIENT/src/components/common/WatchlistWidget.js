import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WatchlistWidget = ({ username, name, description, unwatchedCount, watchingCount, watchedCount, tags }) => {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const widgetRef = useRef(null);

  // Ensure tags is always an array
  const tagArray = Array.isArray(tags) ? tags : [];

  useEffect(() => {
    const adjustFontSize = () => {
      const titleElement = titleRef.current;
      const widgetElement = widgetRef.current;
      if (titleElement && widgetElement) {
        const padding = 40; // Adjust based on your padding/margins
        const availableWidth = widgetElement.clientWidth - padding;

        let fontSize = 2.5; // Start with the largest font size
        titleElement.style.fontSize = `${fontSize}rem`;
        titleElement.style.whiteSpace = 'nowrap';

        while (titleElement.scrollWidth > availableWidth && fontSize > 1.4) {
          fontSize -= 0.1;
          titleElement.style.fontSize = `${fontSize}rem`;
        }

        titleElement.style.whiteSpace = 'normal';
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
    <div ref={widgetRef} onClick={handleClick} className="watchlist-widget text-[#e6e6e6] rounded-lg p-4 shadow-lg flex flex-col justify-between w-full cursor-pointer">
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col" style={{ marginTop: '5px' }}>
          <div ref={titleRef} className="title-container font-bold mr-3" style={{ textAlign: 'left', overflowWrap: 'break-word' }}>{name}</div>
          <div className="text-sm text-gray-400" style={{ textAlign: 'left', marginTop: '2px' }}>{description}</div>
        </div>
        <div className="number-container flex flex-col items-end">
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
