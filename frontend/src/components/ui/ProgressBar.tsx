import React from 'react';

interface ProgressBarProps {
  progress: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'wave' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  max = 100,
  size = 'md',
  variant = 'wave',
  showLabel = false,
  className = '' 
}) => {
  const percentage = Math.min((progress / max) * 100, 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variants = {
    wave: 'bg-wave-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-gray-200 dark:bg-dark-border rounded-full ${sizes[size]}`}>
        <div
          className={`${variants[variant]} rounded-full transition-all duration-500 ease-out ${sizes[size]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
