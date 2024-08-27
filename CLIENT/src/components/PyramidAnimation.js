import React, { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

const PyramidAnimation = () => {
  const pyramidRef = useRef([]);

  useEffect(() => {
    const numRows = 5; // Number of rows in the pyramid

    const createInvertedPyramid = () => {
      const positions = [];
      const circleSize = 30; // Adjust the size of the circles
      const spacing = 0.6; // Adjust the spacing multiplier

      for (let row = 0; row < numRows; row++) {
        for (let col = 0; col <= row; col++) {
          const x = (row - col) * circleSize - (row * circleSize) / 2;
          const y = row * circleSize * spacing; // Adjust y-coordinate to flip the pyramid
          positions.push({ x, y });
        }
      }
      return positions;
    };

    const pyramidPositions = createInvertedPyramid();

    // Set initial positions of the circles
    pyramidRef.current.forEach((el, i) => {
      if (el) {
        el.style.transform = `translate(${pyramidPositions[i].x}px, ${pyramidPositions[i].y}px)`;
      }
    });

    const crumble = () => {
      const finalY = 200;
      anime({
        targets: pyramidRef.current.filter(Boolean),
        translateX: 0, // Spread out horizontally
        translateY: (el, i) => finalY - pyramidPositions[i].y, // Move to a common y position (adjust based on your layout)
        rotate: () => anime.random(-180, 180),
        duration: 2000,
        easing: 'easeInOutQuad',
        complete: () => {
          setTimeout(reform, 1300); // Wait 1 second before reforming
        },
      });
    };

    const reform = () => {
      const finalY = 200;
      anime({
        targets: pyramidRef.current.filter(Boolean),
        translateX: 0,
        translateY: (el, i) => - finalY + pyramidPositions[i].y,
        rotate: 0,
        duration: 2000,
        easing: 'easeInOutQuad',
        complete: () => {
          setTimeout(crumble, 1300); // Wait 1 second before crumbling again
        },
      });
    };

    const checkRefsAndStart = () => {
      if (pyramidRef.current.every(ref => ref !== null)) {
        setTimeout(crumble, 1000); // Start the animation after 1 second
      } else {
        requestAnimationFrame(checkRefsAndStart);
      }
    };

    checkRefsAndStart();
  }, []);

  return (
    <div className="h-[10rem] relative">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="circle"
          ref={(el) => (pyramidRef.current[i] = el)}
        ></div>
      ))}
    </div>
  );
};

export default PyramidAnimation;