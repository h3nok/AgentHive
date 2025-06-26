import React from 'react';
import './LoadingDots.css';

interface LoadingDotsProps {
  className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ className = '' }) => {
  return (
    <div className={`loading-dots ${className}`}>
      <span className="dot dot-1"></span>
      <span className="dot dot-2"></span>
      <span className="dot dot-3"></span>
    </div>
  );
};

export default LoadingDots;
