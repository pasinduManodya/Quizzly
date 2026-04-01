import React from 'react';
import Logo from './Logo';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'gray' | 'black';
  text?: string;
  className?: string;
  showLogo?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'black', 
  text,
  className = '',
  showLogo = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600',
    black: 'border-black'
  };

  if (showLogo) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative" style={{ overflow: 'hidden' }}>
            <Logo size={size === 'lg' ? 200 : size === 'md' ? 150 : 100} />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,1) 20%, rgba(255,255,255,1) 80%, rgba(255,255,255,0))',
              animation: 'wipeReveal 4s ease-in-out infinite'
            }}></div>
          </div>
          {text && (
            <p className="text-sm text-gray-900 font-medium">{text}</p>
          )}
        </div>
        <style>{`
          @keyframes wipeReveal {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <div className="relative">
          <div className={`animate-spin rounded-full border-2 border-gray-200 ${sizeClasses[size]} ${colorClasses[color]} border-t-transparent`}></div>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to right, rgba(255,255,255,0), rgba(255,255,255,0.8) 50%, rgba(255,255,255,0))',
            animation: 'wipeReveal 4s ease-in-out infinite',
            pointerEvents: 'none'
          }}></div>
        </div>
        {text && (
          <p className="text-sm text-gray-900 animate-pulse">{text}</p>
        )}
      </div>
      <style>{`
        @keyframes wipeReveal {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
