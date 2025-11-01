import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isActive: boolean;
  progress?: number; // External progress control (0-100)
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  showPercentage?: boolean;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  isActive,
  progress: externalProgress,
  className = '',
  variant = 'primary',
  showPercentage = true,
  animated = true
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // Use external progress if provided, otherwise use internal
  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setInternalProgress(0);
    } else {
      // Reset progress when not active
      setInternalProgress(0);
      setTimeout(() => setIsVisible(false), 300); // Delay hiding for smooth transition
    }
  }, [isActive]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          glow: 'shadow-green-500/50',
          text: 'text-green-700'
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-orange-500 to-red-500',
          glow: 'shadow-orange-500/50',
          text: 'text-orange-700'
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
          glow: 'shadow-blue-500/50',
          text: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-purple-600',
          glow: 'shadow-blue-500/50',
          text: 'text-blue-700'
        };
    }
  };

  const styles = getVariantStyles();

  if (!isVisible) return null;

  return (
    <div className={`relative w-full ${className}`}>
      {/* Background track */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner">
        {/* Progress bar */}
        <div
          className={`h-full ${styles.bg} rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
            animated ? 'shadow-lg' : ''
          }`}
          style={{ 
            width: `${Math.min(currentProgress, 100)}%`,
            transition: 'width 0.3s ease-out'
          }}
        >
          {/* Animated shimmer effect */}
          {animated && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          )}
          
          {/* Glowing effect */}
          {animated && (
            <div 
              className={`absolute inset-0 rounded-full ${styles.glow} shadow-lg blur-sm`}
              style={{ 
                opacity: Math.min(currentProgress / 50, 1),
                transform: 'scale(1.1)'
              }}
            ></div>
          )}
        </div>
      </div>
      
      {/* Percentage text */}
      {showPercentage && (
        <div className={`text-xs font-semibold mt-1 ${styles.text} transition-opacity duration-300`}>
          {Math.round(currentProgress)}%
        </div>
      )}
      
      {/* Animated dots for extra visual appeal */}
      {animated && isActive && (
        <div className="flex justify-center mt-2 space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-1 h-1 rounded-full ${styles.bg} animate-pulse`}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
