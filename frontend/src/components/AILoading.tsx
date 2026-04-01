import React from 'react';
import Logo from './Logo';

interface AILoadingProps {
  text?: string;
  className?: string;
}

const AILoading: React.FC<AILoadingProps> = ({ 
  text = 'AI is thinking...',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* Logo with wipe reveal animation */}
        <div className="relative" style={{ overflow: 'hidden' }}>
          <Logo size={150} />
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
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">{text}</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-black rounded-full" style={{ animation: 'fadeInOut 1.5s ease-in-out infinite', animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-black rounded-full" style={{ animation: 'fadeInOut 1.5s ease-in-out infinite', animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-black rounded-full" style={{ animation: 'fadeInOut 1.5s ease-in-out infinite', animationDelay: '0.4s' }}></div>
          </div>
        </div>
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
        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default AILoading;
