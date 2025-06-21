import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface RatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  circleSize?: number;
  circleGap?: number;
  hideValue?: boolean;
}

const NUM_CIRCLES = 5;

const Rating: React.FC<RatingProps> = ({ 
  rating, 
  onRatingChange, 
  circleSize = 24, 
  circleGap = 8,
  hideValue = false
}) => {
  const [displayRating, setDisplayRating] = useState(rating);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const CIRCLE_SIZE = circleSize;
  const CIRCLE_GAP = circleGap;

  useEffect(() => {
    setDisplayRating(rating);
  }, [rating]);

  // Helper to get rating from mouse position (continuous, no gaps)
  const getRatingFromPosition = (clientX: number) => {
    if (!containerRef.current) return displayRating;
    const rect = containerRef.current.getBoundingClientRect();
    let x = clientX - rect.left;
    x = Math.max(0, Math.min(x, rect.width));
    const percent = x / rect.width;
    // Snap to the nearest lower integer if in the gap between circles
    const raw = percent * NUM_CIRCLES;
    const circleIndex = Math.floor(raw);
    const circleStart = (circleIndex / NUM_CIRCLES) * rect.width;
    const circleEnd = ((circleIndex + 1) / NUM_CIRCLES) * rect.width;
    const gapPx = CIRCLE_GAP;
    // If in the gap, snap to the left circle's integer (circleIndex + 1)
    if (x > circleEnd - gapPx && x < circleEnd) {
      return circleIndex + 1.0;
    }
    // Otherwise, allow continuous value
    return Math.round(raw * 10) / 10;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDragging(true);
    setDisplayRating(getRatingFromPosition(e.clientX));
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!dragging) return;
    setDisplayRating(getRatingFromPosition(e.clientX));
  };

  const handlePointerUp = () => {
    setDragging(false);
    onRatingChange(Math.round(displayRating * 10) / 10);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>, value: number) => {
    e.stopPropagation();
    setDisplayRating(value);
    onRatingChange(value);
  };

  return (
    <div
      className="flex items-center select-none"
      ref={containerRef}
      style={{ gap: CIRCLE_GAP, width: NUM_CIRCLES * (CIRCLE_SIZE + CIRCLE_GAP) - CIRCLE_GAP }}
      onPointerDown={handlePointerDown}
      onClick={e => e.stopPropagation()}
      role="slider"
      aria-valuenow={displayRating}
      aria-valuemin={0}
      aria-valuemax={NUM_CIRCLES}
      tabIndex={0}
    >
      {[...Array(NUM_CIRCLES)].map((_, i) => {
        const value = i + 1;
        const fill = Math.max(0, Math.min(1, displayRating - i));
        return (
          <div
            key={i}
            className="relative cursor-pointer"
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
          >
            <svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}> 
              <circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={CIRCLE_SIZE / 2 - 2}
                fill="#232323"
                stroke="#fbbf24"
                strokeWidth={1}
              />
              <defs>
                <clipPath id={`clip-${i}`}> 
                  <rect
                    x="0"
                    y="0"
                    width={CIRCLE_SIZE * fill}
                    height={CIRCLE_SIZE}
                  />
                </clipPath>
              </defs>
              <circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={CIRCLE_SIZE / 2 - 2}
                fill="#fbbf24"
                stroke="#fbbf24"
                strokeWidth={1}
                clipPath={`url(#clip-${i})`}
              />
            </svg>
          </div>
        );
      })}
      {!hideValue && (
        <span className="ml-2 text-gray-400" style={{ minWidth: 32, textAlign: 'right' }}>{displayRating.toFixed(1)}</span>
      )}
    </div>
  );
};

export default Rating; 