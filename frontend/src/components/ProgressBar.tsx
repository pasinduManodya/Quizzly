import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  isActive: boolean;
  progress?: number; // External progress control (0-100)
  className?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info';
  showPercentage?: boolean;
  animated?: boolean;
  onCancel?: () => void; // Callback when cancel button is clicked
  showCancelButton?: boolean; // Show cancel button on hover
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  isActive,
  progress: externalProgress,
  className = '',
  variant = 'primary',
  showPercentage = true,
  animated = true,
  onCancel,
  showCancelButton = false
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
    <div 
      className={`relative w-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background track */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner relative group">
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

        {/* Cancel button on hover */}
        {showCancelButton && onCancel && isHovered && (
          <button
            onClick={(e) => {
              console.log('🛑 ProgressBar cancel button (hover) clicked');
              e.stopPropagation();
              onCancel();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-full transition-all duration-200 group-hover:opacity-100 opacity-0"
            title="Cancel operation"
          >
            <svg 
              className="w-4 h-4 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={3} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>
      
      {/* Percentage text and cancel button container */}
      <div className="flex items-center justify-between mt-1">
        {/* Percentage text */}
        {showPercentage && (
          <div className={`text-xs font-semibold ${styles.text} transition-opacity duration-300`}>
            {Math.round(currentProgress)}%
          </div>
        )}
        
        {/* Cancel button for mobile/always visible */}
        {showCancelButton && onCancel && !isHovered && (
          <button
            onClick={(e) => {
              console.log('🛑 ProgressBar cancel button (text - not hovered) clicked');
              e.stopPropagation();
              onCancel();
            }}
            className="ml-auto px-2 py-0.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
            title="Cancel operation"
          >
            Cancel
          </button>
        )}
        
        {/* Cancel button visible on hover */}
        {showCancelButton && onCancel && isHovered && (
          <button
            onClick={(e) => {
              console.log('🛑 ProgressBar cancel button (text - hovered) clicked');
              e.stopPropagation();
              onCancel();
            }}
            className="ml-auto px-2 py-0.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-all duration-200"
            title="Cancel operation"
          >
            Cancel
          </button>
        )}
      </div>
      
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
