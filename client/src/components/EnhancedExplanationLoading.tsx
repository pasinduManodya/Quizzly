import React from 'react';

interface EnhancedExplanationLoadingProps {
  text?: string;
  className?: string;
}

const EnhancedExplanationLoading: React.FC<EnhancedExplanationLoadingProps> = ({ 
  text = 'Generating enhanced explanation...',
  className = '' 
}) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-6">
        {/* Main AI Brain with Enhanced Animation */}
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          
          {/* Inner pulsing brain */}
          <div className="absolute inset-2 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center float-animation">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          {/* Floating knowledge particles */}
          <div className="absolute -top-3 -right-3 w-4 h-4 bg-blue-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
          <div className="absolute -bottom-3 -left-3 w-3 h-3 bg-purple-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '0.7s', animationDuration: '2.5s' }}></div>
          <div className="absolute top-1 -left-4 w-3 h-3 bg-green-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '1.4s', animationDuration: '2.2s' }}></div>
          <div className="absolute -top-1 -right-4 w-2 h-2 bg-yellow-400 rounded-full animate-bounce shadow-lg" style={{ animationDelay: '2.1s', animationDuration: '1.8s' }}></div>
          
          {/* Knowledge waves */}
          <div className="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-20"></div>
          <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-20" style={{ animationDelay: '0.5s' }}></div>
        </div>
        
        {/* Enhanced loading text with typewriter effect */}
        <div className="text-center max-w-md">
          <div className="relative">
            <p className="text-lg font-semibold text-gray-700 mb-3">{text}</p>
            
            {/* Progress dots with staggered animation */}
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-md" style={{ animationDelay: '0s', animationDuration: '1.5s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-md" style={{ animationDelay: '0.2s', animationDuration: '1.5s' }}></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce shadow-md" style={{ animationDelay: '0.4s', animationDuration: '1.5s' }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-md" style={{ animationDelay: '0.6s', animationDuration: '1.5s' }}></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce shadow-md" style={{ animationDelay: '0.8s', animationDuration: '1.5s' }}></div>
            </div>
          </div>
          
          {/* Subtitle with fade effect */}
          <p className="text-sm text-gray-500 mt-3 animate-pulse">
            Analyzing question patterns and generating comprehensive insights...
          </p>
        </div>
        
        {/* Progress bar simulation */}
        <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full animate-pulse" 
               style={{ 
                 width: '100%',
                 background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #4f46e5 100%)',
                 animation: 'progress-shimmer 2s ease-in-out infinite'
               }}>
          </div>
        </div>
        
        {/* Floating text elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-8 left-8 text-xs text-blue-400 opacity-60 animate-pulse" style={{ animationDelay: '0.5s' }}>
            💡 Analyzing...
          </div>
          <div className="absolute top-12 right-8 text-xs text-purple-400 opacity-60 animate-pulse" style={{ animationDelay: '1s' }}>
            🧠 Processing...
          </div>
          <div className="absolute bottom-8 left-12 text-xs text-indigo-400 opacity-60 animate-pulse" style={{ animationDelay: '1.5s' }}>
            ✨ Enhancing...
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes progress-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          .float-animation {
            animation: float 3s ease-in-out infinite;
          }
        `
      }} />
    </div>
  );
};

export default EnhancedExplanationLoading;
