import React from 'react';
import Logo from './Logo';
import styles from './LoadingAnimation.module.css';

const LoadingAnimation = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.logoWrapper}>
        <Logo scale={0.5} color="#383838" />
        <div className={styles.bouncingBoxContainer}>
          <div className={styles.bouncingBox}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation; 