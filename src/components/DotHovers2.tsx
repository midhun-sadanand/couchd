"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const DotHovers2 = () => {
  const [dots, setDots] = useState<boolean[]>(Array(216).fill(false));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    const newDots = [...dots];
    newDots[index] = true;
    setDots(newDots);
  };

  const handleMouseLeave = (index: number) => {
    setHoveredIndex(null);
    const newDots = [...dots];
    newDots[index] = false;
    setDots(newDots);
  };

  return (
    <div className="grid grid-cols-18 gap-1">
      {dots.map((isHovered, index) => (
        <motion.div
          key={index}
          className={`w-2 h-2 rounded-full ${
            isHovered ? 'bg-white' : 'bg-gray-600'
          }`}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave(index)}
          animate={{
            scale: isHovered ? 1.5 : 1,
            backgroundColor: isHovered ? '#ffffff' : '#4B5563',
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  );
};

export default DotHovers2; 