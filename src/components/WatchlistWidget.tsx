import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Folder } from 'lucide-react';
import EditNameModal from './EditWatchlistModal';
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
  image,
  deleteWatchlist
}) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditNameModalOpen, setEditNameModalOpen] = useState(false);
  const [currentName, setCurrentName] = useState(listName);
  const [isHovered, setIsHovered] = useState(false);

  // Prefetch media items on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    queryClient.prefetchQuery({
      queryKey: ['mediaItems', watchlistId],
      queryFn: async () => {
        if (!supabase) return [];
        const { data } = await supabase
          .from('media_items')
          .select('*')
          .eq('watchlist_id', watchlistId)
          .order('created_at', { ascending: false });
        return data || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Ensure tags is always an array
  const tagArray = Array.isArray(tags) ? tags : [];

  useEffect(() => {
    const adjustFontSize = () => {
      const titleElement = titleRef.current;
      const widgetElement = widgetRef.current;
      if (titleElement && widgetElement) {
        const availableWidth = widgetElement.clientWidth - 32; // Account for padding
  
        let fontSize = 1.5;
        titleElement.style.fontSize = `${fontSize}rem`;
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.overflow = 'hidden';
        titleElement.style.textOverflow = 'ellipsis';
  
        if (titleElement.scrollWidth > availableWidth) {
          while (titleElement.scrollWidth > availableWidth && fontSize > 0.875) {
            fontSize -= 0.05;
            titleElement.style.fontSize = `${fontSize}rem`;
          }
          
          titleElement.style.whiteSpace = 'nowrap';
          titleElement.style.overflow = 'hidden';
          titleElement.style.textOverflow = 'ellipsis';
        }
      }
    };
  
    adjustFontSize();
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [currentName]);

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
          descriptionElement.style.webkitLineClamp = String(maxLines);
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
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const handleEditNameClick = () => {
    setDropdownOpen(false);
    setEditNameModalOpen(true);
  };

  const handleEditNameSubmit = (newName: string) => {
    setCurrentName(newName);
  };

  const totalCount = unwatchedCount + watchingCount + watchedCount;

  return (
    <>
      <div className="flex flex-col" style={{ width: '220px' }}>
        {/* Square card with image */}
        <div 
          ref={widgetRef} 
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="group watchlist-widget text-[#e6e6e6] rounded-lg shadow-lg cursor-pointer relative transition-all duration-300"
          style={{ 
            width: '220px',
            height: '220px'
          }}
        >
          {/* Default state: Watchlist image */}
          <div className={`absolute inset-0 transition-opacity duration-300 rounded-lg overflow-hidden ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
            {image ? (
              <img 
                src={image} 
                alt={currentName}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/280?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-full bg-[#2a2a2a] flex items-center justify-center rounded-lg">
                <Folder size={64} className="text-gray-600" strokeWidth={1.5} />
              </div>
            )}
          </div>

          {/* Hover state: Full information with dark overlay */}
          <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm p-6 flex flex-col transition-opacity duration-300 rounded-lg ${isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Header with counts */}
            <div className="mb-3">
              <div className="flex gap-3 text-lg font-eina-bold mb-1">
                <span className="text-red-500">{unwatchedCount}</span>
                <span className="text-gray-600">·</span>
                <span className="text-yellow-500">{watchingCount}</span>
                <span className="text-gray-600">·</span>
                <span className="text-green-500">{watchedCount}</span>
              </div>
              <div className="text-xs text-gray-400 font-eina">to consume · consuming · consumed</div>
            </div>

            {/* Description */}
            {description && (
              <div ref={descriptionRef} className="text-gray-300 text-sm mb-3 line-clamp-4 font-eina flex-1">
                {description}
              </div>
            )}

            {/* Tags */}
            {tagArray.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tagArray.slice(0, 3).map((tag, index) => (
                  <div key={index} className="text-xs px-2 py-1 rounded-md bg-[#3a3a3a] text-gray-300 font-eina">
                    {tag}
                  </div>
                ))}
                {tagArray.length > 3 && (
                  <div className="text-xs px-2 py-1 text-gray-400 font-eina">
                    +{tagArray.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Total count */}
            <div className="mt-auto pt-3 border-t border-gray-700">
              <div className="text-sm text-gray-300 font-eina-bold">
                {totalCount} total item{totalCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Options menu button - positioned within the card */}
          <button 
            className="absolute top-3 right-3 z-30 p-1.5 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors" 
            onClick={handleDropdownClick}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 text-white/80 hover:text-white transition-colors">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </button>

          {/* Dropdown menu - positioned relative to card */}
          {dropdownOpen && (
            <div 
              className="absolute top-14 right-3 w-48 bg-[#1a1a1a] rounded-lg shadow-2xl py-1 z-40 border border-[#3a3a3a]"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors font-eina" onClick={(e) => { e.stopPropagation(); handleEditNameClick(); }}>Edit Name</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors font-eina" onClick={(e) => { e.stopPropagation(); }}>Edit Description</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-[#2a2a2a] transition-colors font-eina" onClick={(e) => { e.stopPropagation(); }}>Edit Tags</button>
              <button className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#2a2a2a] transition-colors font-eina" onClick={(e) => { e.stopPropagation(); deleteWatchlist(watchlistId); }}>Remove Watchlist</button>
            </div>
          )}
        </div>
        
        {/* Title below the square - left aligned */}
        <div className="">
          <div className="text-base text-[#cccccc] font-eina-bold text-left line-clamp-2">
            {currentName}
          </div>
        </div>
      </div>
      <EditNameModal
        isOpen={isEditNameModalOpen}
        onClose={() => setEditNameModalOpen(false)}
        currentName={currentName}
        onSubmit={handleEditNameSubmit}
        currentDescription={''}
        currentTags={[]}
        watchlistId={watchlistId}
      />
    </>
  );
};

export default WatchlistWidget; 