import { useEffect, useRef, useState } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number;
  edgeThreshold?: number;
  requireEdgeStart?: boolean;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, edgeThreshold = 30, requireEdgeStart = false } = options;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      
      // If requiring edge start, check if touch started near edge
      if (requireEdgeStart) {
        const windowWidth = window.innerWidth;
        const isLeftEdge = startX < edgeThreshold;
        const isRightEdge = startX > windowWidth - edgeThreshold;
        
        if (!isLeftEdge && !isRightEdge) {
          return;
        }
      }

      touchStartRef.current = {
        x: startX,
        y: startY,
        time: Date.now(),
      };
      setIsSwiping(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      // Prevent default scrolling while swiping from edges
      if (requireEdgeStart) {
        const deltaX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
        if (deltaX > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Determine primary swipe direction
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Velocity check (pixels per ms)
      const velocity = Math.max(absDeltaX, absDeltaY) / deltaTime;

      // Only trigger if swipe is fast enough and long enough
      if (velocity > 0.3 || Math.max(absDeltaX, absDeltaY) > threshold) {
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (deltaX > threshold && handlers.onSwipeRight) {
            handlers.onSwipeRight();
          } else if (deltaX < -threshold && handlers.onSwipeLeft) {
            handlers.onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > threshold && handlers.onSwipeDown) {
            handlers.onSwipeDown();
          } else if (deltaY < -threshold && handlers.onSwipeUp) {
            handlers.onSwipeUp();
          }
        }
      }

      touchStartRef.current = null;
      setIsSwiping(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, edgeThreshold, requireEdgeStart]);

  return { isSwiping };
}

