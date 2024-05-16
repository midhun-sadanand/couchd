// MovieCard.js
import React from 'react';

const MovieCard = ({ id, title, onRemove }) => {
  return (
    <div className="shadow-lg rounded-lg overflow-hidden my-4">
      <div className="px-6 py-4">
        <div className="font-bold text-xl mb-2">{title}</div>
        <button onClick={() => onRemove(id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Remove
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
