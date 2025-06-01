import React from 'react';
import { Search, Command } from '@geist-ui/icons';

interface SearchBarProps {
  onSearchClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchClick }) => {
  return (
    <div className="search-bar" onClick={onSearchClick}>
      <Search className="search-icon" color="#888888"/>
      <span className="search-placeholder" style={{fontFamily: 'GeistRegular'}}>Search...</span>
      <kbd className="kbd" size={12}>
        <div className="command-icon-container">
          <Command className="command-icon" />
          <span className="K">K</span>
        </div>
      </kbd>
    </div>
  );
};

export default SearchBar; 