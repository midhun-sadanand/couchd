import React, { useState, useEffect } from 'react';

interface RatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

const Rating: React.FC<RatingProps> = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  useEffect(() => {
    setCurrentRating(rating);
  }, [rating]);

  const handleMouseEnter = (value: number) => {
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>, value: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfValue = x < rect.width / 2 ? value - 0.5 : value;
    setHoverRating(halfValue);
  };

  const handleRatingClick = (newRating: number) => {
    setCurrentRating(newRating);
    onRatingChange(newRating);
  };

  const getFillColor = (index: number) => {
    if (hoverRating >= index) {
      return 'text-gray-800';
    } else if (!hoverRating && currentRating >= index) {
      return 'text-gray-800';
    } else if (hoverRating >= index - 0.5 && hoverRating < index) {
      return 'text-gray-800 fill-half';
    } else if (currentRating >= index - 0.5 && currentRating < index) {
      return 'text-gray-800 fill-half';
    } else {
      return 'text-gray-300';
    }
  };

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((value) => (
        <div
          key={value}
          onMouseMove={(e) => handleMouseMove(e, value)}
          onMouseEnter={() => handleMouseEnter(value)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleRatingClick(hoverRating || value)}
          className="relative w-6 h-6 cursor-pointer"
        >
          <svg
            className="w-full h-full"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="12" r="10" className="text-gray-300" fill="currentColor" />
            <circle cx="12" cy="12" r="10" className={`absolute ${getFillColor(value)}`} fill="currentColor" />
            {(hoverRating >= value - 0.5 && hoverRating < value) || (currentRating >= value - 0.5 && currentRating < value) ? (
              <circle cx="12" cy="12" r="10" className="text-gray-300 half-circle" fill="currentColor" />
            ) : null}
          </svg>
        </div>
      ))}
      <span className="ml-2 text-gray-400">{currentRating.toFixed(1)}</span>
    </div>
  );
};

export default Rating; 