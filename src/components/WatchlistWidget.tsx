import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditNameModal from './EditWatchlistModal';

interface WatchlistWidgetProps {
  username: string;
  watchlistId: string;
  listName: string;
  description: string;
  unwatchedCount: number;
  watchingCount: number;
  watchedCount: number;
  tags: string[];
  deleteWatchlist: (id: string) => void;
}

const WatchlistWidget: React.FC<WatchlistWidgetProps> = ({
  username,
  watchlistId,
  listName,
  description,
  unwatchedCount,
  watchingCount,
  watchedCount,
  tags,
  deleteWatchlist
}) => {
  const router = useRouter();
  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
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
        const padding = 40;
        const numberContainerWidth = 40;
        const availableWidth = widgetElement.clientWidth - padding - numberContainerWidth;
  
        let fontSize = 2.5;
        titleElement.style.fontSize = `${fontSize}rem`;
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.overflow = 'hidden';
        titleElement.style.textOverflow = 'ellipsis';
  
        if (titleElement.scrollWidth > availableWidth) {
          while (titleElement.scrollWidth > availableWidth && fontSize > 1.25) {
            fontSize -= 0.1;
            titleElement.style.fontSize = `${fontSize}rem`;
          }
  
          if (titleElement.scrollWidth > availableWidth) {
            titleElement.style.whiteSpace = 'nowrap';
            titleElement.style.overflow = 'hidden';
            titleElement.style.textOverflow = 'ellipsis';
          } else {
            titleElement.style.whiteSpace = 'normal';
            titleElement.style.wordWrap = 'break-word';
          }
        } else {
          titleElement.style.whiteSpace = 'normal';
          titleElement.style.overflow = 'visible';
          titleElement.style.textOverflow = 'clip';
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
    router.push(`/watchlist/${watchlistId}`);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDropdownOpen(!dropdownOpen);
  };

  const handleEditNameClick = () => {
    setDropdownOpen(false);
    setEditNameModalOpen(true);
  };

  const handleEditNameSubmit = (newName: string) => {
    setCurrentName(newName);
  };

  return (
    <>
      <div 
        ref={widgetRef} 
        onClick={handleClick} 
        className="watchlist-widget min-w-[200px] text-[#e6e6e6] rounded-lg p-4 shadow-lg flex flex-col justify-between w-full cursor-pointer relative bg-[#232323] hover:bg-[#2a2a2a] transition-colors duration-200"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col" style={{ marginTop: '5px', marginRight: '40px' }}>
            <div ref={titleRef} className="title-container font-bold" style={{ textAlign: 'left', overflowWrap: 'break-word' }}>{currentName}</div>
            <div ref={descriptionRef} className="description text-gray-400" style={{ textAlign: 'left', marginTop: '2px' }}>{description}</div>
          </div>
          <div className="number-container flex flex-col items-end" style={{ flexShrink: 0 }}>
            <div className="text-red-500">{unwatchedCount}</div>
            <div className="text-yellow-500">{watchingCount}</div>
            <div className="text-green-500">{watchedCount}</div>
          </div>
        </div>
        <div className="flex flex-wrap">
          {tagArray.map((tag, index) => (
            <div key={index} className="text-sm px-2 py-1 rounded-full mr-2 mb-2 tag bg-[#3b3b3b] text-gray-300">
              {tag}
            </div>
          ))}
        </div>
        <div className="absolute bottom-4 right-4" onClick={handleDropdownClick}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400 hover:text-white transition-colors duration-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>

          {dropdownOpen && (
            <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-md shadow-lg py-1 z-20">
              <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3b3b3b]" onClick={handleEditNameClick}>Edit Name</button>
              <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3b3b3b]" onClick={() => {/* handle edit description */}}>Edit Description</button>
              <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3b3b3b]" onClick={() => {/* handle edit tags */}}>Edit Tags</button>
              <button className="block px-4 py-2 text-sm text-red-500 hover:bg-[#3b3b3b]" onClick={() => deleteWatchlist(watchlistId)}>Remove Watchlist</button>
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