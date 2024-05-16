import React from 'react';

function SearchBar({ placeholder, onSearch }) {
  return (
    <div className="max-w-md mx-auto">
      <input
        type="text"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        placeholder={placeholder}
        onKeyPress={onSearch}
      />
      <button
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={onSearch}
      >
        Search
      </button>
    </div>
  );
}

export default SearchBar;
