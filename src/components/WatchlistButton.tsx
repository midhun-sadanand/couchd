import React from 'react';
import { Grid } from '@geist-ui/icons';

interface WatchlistButtonProps {
  onClick: () => void;
  hovered: {
    home: boolean;
    grid: boolean;
    bell: boolean;
  };
  setHovered: React.Dispatch<React.SetStateAction<{
    home: boolean;
    grid: boolean;
    bell: boolean;
  }>>;
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