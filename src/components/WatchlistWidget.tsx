import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import EditWatchlistModal from './EditWatchlistModal';
import { useSupabaseClient } from '../utils/auth';

interface WatchlistWidgetProps {
  username: string;
  watchlistId: string;
  listName: string;
  description: string;
  unwatchedCount: number;
  watchingCount: number;
  watchedCount: number;
  tags: string[];
  image?: string;
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
  image = '',
  deleteWatchlist
}) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [currentName, setCurrentName] = useState(listName);
  const [currentDescription, setCurrentDescription] = useState(description);
  const [currentTags, setCurrentTags] = useState(tags);

  // Ensure tags is always an array
  const tagArray = Array.isArray(tags) ? tags : [];

  useEffect(() => {
    const adjustFontSize = () => {
      const titleElement = titleRef.current;
      const widgetElement = widgetRef.current;
      if (titleElement && widgetElement) {
        const widgetWidth = widgetElement.offsetWidth;
        const titleWidth = titleElement.scrollWidth;
        const fontSize = parseInt(window.getComputedStyle(titleElement).fontSize);
        if (titleWidth > widgetWidth - 40) { // 40px for padding
          const newFontSize = Math.floor((widgetWidth - 40) / (titleWidth / fontSize));
          titleElement.style.fontSize = `${Math.max(newFontSize, 14)}px`;
        } else {
          titleElement.style.fontSize = '16px';
        }
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

  const handleEditClick = () => {
    setDropdownOpen(false);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (newName: string, newDescription: string, newTags: string[]) => {
    try {
      // Update the watchlist in the database
      const { error } = await supabase
        .from('watchlists')
        .update({
          name: newName,
          description: newDescription,
          tags: newTags
        })
        .eq('id', watchlistId);

      if (error) throw error;

      // Update local state
      setCurrentName(newName);
      setCurrentDescription(newDescription);
      setCurrentTags(newTags);
      setEditModalOpen(false);
    } catch (err: any) {
      console.error('Error updating watchlist:', err);
    }
  };

  return (
    <>
      <div
        ref={widgetRef}
        className="relative bg-[#1c1c1c] rounded-lg p-6 w-full cursor-pointer hover:bg-[#282828] transition-colors duration-200"
        onClick={handleClick}
      >
        <div className="flex flex-col h-full">
          <div
            ref={titleRef}
            className="text-xl font-bold text-white mb-2 font-['EinaBold']"
          >
            {currentName}
          </div>
          <div
            ref={descriptionRef}
            className="text-sm text-[#b3b3b3] mb-4 font-['EinaRegular']"
          >
            {currentDescription}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {tagArray.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-[#282828] text-[#b3b3b3] rounded-full font-['EinaRegular']"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between text-sm text-[#b3b3b3] mt-auto font-['EinaRegular']">
            <span>To Watch: {unwatchedCount}</span>
            <span>Watching: {watchingCount}</span>
            <span>Watched: {watchedCount}</span>
          </div>
        </div>
        <div className="absolute bottom-4 right-4" onClick={handleDropdownClick}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 text-gray-400 hover:text-white transition-colors duration-200">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
          </svg>

          {dropdownOpen && (
            <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-md shadow-lg py-1 z-20">
              <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#3b3b3b]" onClick={handleEditClick}>Edit Watchlist</button>
              <button className="block px-4 py-2 text-sm text-red-500 hover:bg-[#3b3b3b]" onClick={() => deleteWatchlist(watchlistId)}>Remove Watchlist</button>
            </div>
          )}
        </div>
      </div>
      <EditWatchlistModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        currentName={currentName}
        currentDescription={currentDescription}
        currentTags={currentTags}
        watchlistId={watchlistId}
        currentImage={image}
        onSubmit={handleEditSubmit}
      />
    </>
  );
};

export default WatchlistWidget; 