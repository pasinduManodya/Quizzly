import React, { useState, useEffect } from 'react';
import { isOnline, addOnlineListener, addOfflineListener } from '../utils/pwa';

const PWAStatusIndicator: React.FC = () => {
  const [isOnlineStatus, setIsOnlineStatus] = useState(isOnline());
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineStatus(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnlineStatus(false);
      setShowStatus(true);
    };

    addOnlineListener(handleOnline);
    addOfflineListener(handleOffline);

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  if (!showStatus) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
        isOnlineStatus 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isOnlineStatus ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        <span className="text-sm font-medium">
          {isOnlineStatus ? 'Back Online' : 'You\'re Offline'}
        </span>
      </div>
    </div>
  );
};

export default PWAStatusIndicator;
