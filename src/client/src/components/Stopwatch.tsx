import React, { useState, useEffect, useRef } from 'react';

interface StopwatchProps {
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

const Stopwatch: React.FC<StopwatchProps> = ({ onTimeUpdate, className = '' }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(true); // Auto-start
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused]);

  // Separate effect to handle time updates
  useEffect(() => {
    if (onTimeUpdate) {
      onTimeUpdate(time);
    }
  }, [time, onTimeUpdate]);

  const pause = () => {
    setIsPaused(true);
  };

  const resume = () => {
    setIsPaused(false);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="text-lg font-mono font-semibold text-gray-900">
        {formatTime(time)}
      </div>
      <div className="flex space-x-1">
        {isPaused ? (
          <button
            onClick={resume}
            className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
            title="Resume"
          >
            ▶
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-2 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 text-white rounded"
            title="Pause"
          >
            ⏸
          </button>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
