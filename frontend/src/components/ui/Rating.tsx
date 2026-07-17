import React from 'react';
import { Star } from 'lucide-react';

interface RatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({ 
  rating, 
  maxRating = 5, 
  size = 'md',
  showValue = true,
  reviewCount,
  className = '' 
}) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            className={`${sizes[size]} ${
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-yellow-400' 
                : i < rating 
                  ? 'text-yellow-400 fill-yellow-400/50' 
                  : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({reviewCount} reviews)
        </span>
      )}
    </div>
  );
};

export default Rating;
