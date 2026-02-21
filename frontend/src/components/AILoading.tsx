import React from 'react';

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
        {/* AI Brain Animation */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="absolute -bottom-2 -left-2 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-0 -left-3 w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
        </div>
        
        {/* Loading text with typing animation */}
        <div className="text-center">
          <p className="text-lg font-medium text-gray-700 mb-2">{text}</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILoading;
