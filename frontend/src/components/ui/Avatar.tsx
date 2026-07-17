import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt = '', 
  name = '',
  size = 'md',
  status,
  className = '' 
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-xl',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-dark-card`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-wave-100 dark:bg-wave-900/30 text-wave-600 dark:text-wave-400 flex items-center justify-center font-semibold border-2 border-white dark:border-dark-card`}>
          {name ? getInitials(name) : <User className="w-1/2 h-1/2" />}
        </div>
      )}
      {status && (
        <span className={`absolute bottom-0 right-0 w-3 h-3 ${statusColors[status]} rounded-full border-2 border-white dark:border-dark-card`} />
      )}
    </div>
  );
};

export default Avatar;
