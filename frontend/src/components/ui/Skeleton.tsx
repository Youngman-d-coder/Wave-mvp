import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'text',
  width,
  height 
}) => {
  const variants = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-dark-border animate-pulse ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-100 dark:border-dark-border">
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1">
        <Skeleton width="60%" height="20px" className="mb-2" />
        <Skeleton width="40%" height="16px" />
      </div>
    </div>
    <Skeleton width="100%" height="100px" className="mb-4" />
    <div className="flex gap-2">
      <Skeleton width="80px" height="32px" />
      <Skeleton width="80px" height="32px" />
    </div>
  </div>
);

export default Skeleton;
