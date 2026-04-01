import React from 'react';
import { getAvatarById, getInitials } from '../utils/avatars';

interface AvatarProps {
  avatarId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-8 h-8 text-xs',
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
  '2xl': 'w-32 h-32 text-4xl'
};

const Avatar: React.FC<AvatarProps> = ({ 
  avatarId = 'avatar-1', 
  firstName, 
  lastName, 
  email,
  size = 'md',
  className = '',
  onClick
}) => {
  const avatar = getAvatarById(avatarId);
  const initials = getInitials(firstName, lastName, email);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-gradient-to-br ${avatar.gradient}
        rounded-full
        flex items-center justify-center
        font-bold ${avatar.textColor}
        shadow-lg
        ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {initials}
    </div>
  );
};

export default Avatar;
