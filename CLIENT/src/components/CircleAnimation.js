import React, { useEffect, useState, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';


const CircleAnimation = () => {
  useEffect(() => {
    const duration = 3000; // Duration for one complete circle
    const radius = 80; // Radius of the big circle
    const centerX = 100; // Center x-coordinate of the big circle
    const centerY = 100; // Center y-coordinate of the big circle

    anime({
      targets: '#smallCircle',
      easing: 'linear',
      duration: duration,
      loop: true,
      update: function (anim) {
        const progress = anim.currentTime / duration; // Calculate progress as a value between 0 and 1

        // Use a custom easing function that never lets the velocity reach zero
        const adjustedProgress = (1 - Math.cos(progress * Math.PI)) / 2 // Sine wave for smooth motion
        const angle = adjustedProgress * 2 * Math.PI - Math.PI / 2;

        const cx = centerX + radius * Math.cos(angle); // Calculate the x-coordinate
        const cy = centerY + radius * Math.sin(angle); // Calculate the y-coordinate

        // Update position of small circle
        const circle = document.querySelector('#smallCircle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
      }
    });
  }, []);

  return (
    <div className="h-[15rem]">
      <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle id="bigCircle" cx="100" cy="100" r="80" fill="none" stroke="#ddd" strokeWidth="2" />
        <circle
          id="smallCircle"
          cx="180"
          cy="100"
          r="10"
          fill="#888"
          className="circle"
        />
      </svg>
    </div>
  );
};

export default CircleAnimation;