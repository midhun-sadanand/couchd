import React from 'react';
import { Grid } from '@geist-ui/icons';

interface WatchlistButtonProps {
  onClick: () => void;
  hovered: {
    grid: boolean;
  };
  setHovered: (hovered: { grid: boolean }) => void;
}

const WatchlistButton: React.FC<WatchlistButtonProps> = ({ onClick, hovered, setHovered }) => (
  <Grid
    size={28}
    onClick={onClick}
    color={hovered.grid ? '#ffffff' : '#a1a1a1'}
    className="cursor-pointer transition-colors duration-300"
    onMouseEnter={() => setHovered({ ...hovered, grid: true })}
    onMouseLeave={() => setHovered({ ...hovered, grid: false })}
  />
);

export default WatchlistButton; 