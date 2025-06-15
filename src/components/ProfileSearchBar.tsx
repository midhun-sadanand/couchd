import React, { useState, useRef, useEffect } from 'react';
import { Command, Search as SearchIcon } from '@geist-ui/icons';
import { MediaItem } from '@/types';

interface ProfileSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  results: MediaItem[];
  onSelect: (item: MediaItem) => void;
  isLoading: boolean;
  showRecentOnFocus?: boolean;
}

const ProfileSearchBar: React.FC<ProfileSearchBarProps> = ({ value, onChange, results, onSelect, isLoading, showRecentOnFocus }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // Wrap both input and dropdown
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused && (value || showRecentOnFocus)) {
      setDropdownOpen(true);
    } else {
      setDropdownOpen(false);
    }
  }, [isFocused, value, showRecentOnFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs">
      <div className="search-bar flex items-center px-2 py-1 bg-[#333] rounded-md" style={{ cursor: 'text' }} onClick={() => inputRef.current?.focus()}>
        <SearchIcon className="search-icon mr-2" color="#888888" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search..."
          className="flex-1 bg-transparent outline-none text-white placeholder-[#888888] font-[GeistRegular]"
          onFocus={() => setIsFocused(true)}
        />
        <kbd className="kbd ml-2">
          <div className="command-icon-container">
            <Command className="command-icon" />
            <span className="K">K</span>
          </div>
        </kbd>
      </div>
      {dropdownOpen && (
        <div className="absolute left-0 mt-1 w-full bg-[#232323] rounded-md shadow-lg z-50 border border-[#444] max-h-72 overflow-y-auto animate-fade-in-up">
          {isLoading ? (
            <div className="p-3 text-gray-400 text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-gray-400 text-center">No results found</div>
          ) : (
            <ul>
              {results.map(item => (
                <li
                  key={item.id}
                  className="px-4 py-2 cursor-pointer hover:bg-[#363636] flex flex-col"
                  onClick={() => { onSelect(item); setDropdownOpen(false); setIsFocused(false); }}
                >
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="text-xs text-gray-400">{item.medium}{item.creator ? ` • ${item.creator}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSearchBar; 