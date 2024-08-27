import React from 'react';
import { Grid } from '@geist-ui/icons';

const WatchlistButton = ({ onClick, hovered, setHovered }) => (
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
