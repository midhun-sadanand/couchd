import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditNameModal from '../EditWatchlistModal'; // Import the EditNameModal component

const WatchlistWidget = ({ username, watchlistId, listName, description, unwatchedCount, watchingCount, watchedCount, tags }) => {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const widgetRef = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditNameModalOpen, setEditNameModalOpen] = useState(false);
  const [currentName, setCurrentName] = useState(listName);

  // Ensure tags is always an array
  const tagArray = Array.isArray(tags) ? tags : [];

  useEffect(() => {
    const adjustFontSize = () => {
      const titleElement = titleRef.current;
      const widgetElement = widgetRef.current;
      if (titleElement && widgetElement) {
        const padding = 40; // Adjust based on your padding/margins
        const numberContainerWidth = 40; // Adjust based on the width of your number container
        const availableWidth = widgetElement.clientWidth - padding - numberContainerWidth;

        let fontSize = 2.5; // Start with the largest font size
        titleElement.style.fontSize = `${fontSize}rem`;
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.overflow = 'hidden';
        titleElement.style.textOverflow = 'ellipsis';

        // Reduce font size until it fits or reaches the minimum font size
        while (titleElement.scrollWidth > availableWidth && fontSize > 1.25) {
          fontSize -= 0.1;
          titleElement.style.fontSize = `${fontSize}rem`;
        }

        // If it still doesn't fit, allow wrapping
        if (titleElement.scrollWidth > availableWidth) {
          titleElement.style.whiteSpace = 'normal';
          titleElement.style.wordWrap = 'break-word';
        }

        // If it still overflows, apply ellipses
        if (titleElement.scrollWidth > availableWidth) {
          titleElement.style.whiteSpace = 'nowrap';
          titleElement.classList.add('truncate');
        } else {
          titleElement.classList.remove('truncate');
        }

        titleElement.style.width = `${availableWidth}px`;
      }
    };

    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [listName]);

  useEffect(() => {
    const handleDescriptionOverflow = () => {
      const descriptionElement = descriptionRef.current;
      if (descriptionElement) {
        const maxLines = 3;
        const lineHeight = parseInt(window.getComputedStyle(descriptionElement).lineHeight, 10);
        const maxHeight = lineHeight * maxLines;

        descriptionElement.style.whiteSpace = 'pre-wrap';
        descriptionElement.style.wordWrap = 'break-word';

        // Insert line breaks at every 32 characters
        const formattedDescription = description.replace(/(.{32})/g, '$1\n');
        descriptionElement.textContent = formattedDescription;

        if (descriptionElement.scrollHeight > maxHeight) {
          descriptionElement.style.overflow = 'hidden';
          descriptionElement.style.textOverflow = 'ellipsis';
          descriptionElement.style.display = '-webkit-box';
          descriptionElement.style.webkitBoxOrient = 'vertical';
          descriptionElement.style.webkitLineClamp = maxLines;
        } else {
          descriptionElement.style.overflow = 'visible';
          descriptionElement.style.textOverflow = 'clip';
          descriptionElement.style.display = 'block';
        }
      }
    };

    handleDescriptionOverflow();
    window.addEventListener('resize', handleDescriptionOverflow);
    return () => window.removeEventListener('resize', handleDescriptionOverflow);
  }, [description]);

  const handleClick = () => {
    navigate(`/list/${username}/${encodeURIComponent(listName)}/${watchlistId}`);
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleEditNameClick = () => {
    setDropdownOpen(false);
    setEditNameModalOpen(true);
  };

  const handleEditNameSubmit = (newName) => {
    // Handle backend communication to update the name
    // Optimistically update the UI
    setCurrentName(newName);
  };

  return (
    <>
      <div ref={widgetRef} onClick={handleClick} className="watchlist-widget min-w-[200px] text-[#e6e6e6] rounded-lg p-4 shadow-lg flex flex-col justify-between w-full cursor-pointer relative">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col" style={{ marginTop: '5px', marginRight: '40px' }}>
            <div ref={titleRef} className="title-container font-bold" style={{ textAlign: 'left', overflowWrap: 'break-word' }}>{currentName}</div>
            <div ref={descriptionRef} className="description" style={{ textAlign: 'left', marginTop: '2px' }}>{description}</div>
          </div>
          <div className="number-container flex flex-col items-end" style={{ flexShrink: 0 }}>
            <div className="text-red-500">{unwatchedCount}</div>
            <div className="text-yellow-500">{watchingCount}</div>
            <div className="text-green-500">{watchedCount}</div>
          </div>
        </div>
        <div className="flex flex-wrap">
          {tagArray.map((tag, index) => (
            <div key={index} className="text-sm px-2 py-1 rounded-full mr-2 mb-2 tag">
              {tag}
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 right-4" onClick={handleDropdownClick}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>

          {dropdownOpen && (
            <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
              <button className="block px-4 py-2 text-sm text-gray-700" onClick={handleEditNameClick}>Edit Name</button>
              <button className="block px-4 py-2 text-sm text-gray-700" onClick={() => {/* handle edit description */}}>Edit Description</button>
              <button className="block px-4 py-2 text-sm text-gray-700" onClick={() => {/* handle edit tags */}}>Edit Tags</button>
              <button className="block px-4 py-2 text-sm text-red-700" onClick={() => {/* handle remove watchlist */}}>Remove Watchlist</button>
            </div>
          )}
        </div>
      </div>
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setEditNameModalOpen(false)}
        currentName={currentName}
        onSubmit={handleEditNameSubmit}
      />
    </>
  );
};

export default WatchlistWidget;
