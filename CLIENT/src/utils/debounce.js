import React, { useState } from 'react';

const Rating = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleMouseEnter = (value) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleRatingClick = (newRating) => {
    onRatingChange(newRating);
  };

  const getFillColor = (index) => {
    if (hoverRating >= index) {
      return 'text-gray-800';
    } else if (!hoverRating && rating >= index) {
      return 'text-gray-800';
    } else if (!hoverRating && rating >= index - 0.5 && rating < index) {
      return 'text-gray-800 fill-half';
    } else {
      return 'text-gray-300';
    }
  };

  return (
    <div className="flex items-center">
      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => (
        <svg
          key={value}
          onClick={() => handleRatingClick(value)}
          onMouseEnter={() => handleMouseEnter(value)}
          onMouseLeave={handleMouseLeave}
          className={`w-6 h-6 cursor-pointer ${getFillColor(value)}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="10" />
          {value % 1 !== 0 && <circle cx="12" cy="12" r="10" className="text-gray-300 half-circle" fill="currentColor" />}
        </svg>
      ))}
    </div>
  );
};

export default Rating;
