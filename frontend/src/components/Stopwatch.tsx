import React, { useState, useEffect, useRef } from 'react';

interface StopwatchProps {
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

const Stopwatch: React.FC<StopwatchProps> = ({ onTimeUpdate, className = '' }) => {
  const [time, setTime] = useState(0);
  const [isRunning] = useState(true); // Auto-start
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
    <div className={`inline-flex items-center ${className}`}>
      {/* Professional Minimal Timer */}
      <div className="inline-flex items-center rounded-md border border-gray-200 bg-white text-gray-900 shadow-sm px-2.5 py-1.5 sm:px-3 sm:py-1.5">
        {/* Clock Icon */}
        <svg className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        {/* Time Display */}
        <span className="font-mono text-sm sm:text-base font-medium tabular-nums tracking-normal">
          {formatTime(time)}
        </span>

        {/* Divider */}
        <span className="mx-2 h-4 w-px bg-gray-200 hidden sm:inline-block" aria-hidden="true" />

        {/* Pause/Resume Button */}
        {isPaused ? (
          <button
            onClick={resume}
            className="ml-2 inline-flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 h-7 w-7 sm:h-8 sm:w-8"
            title="Resume"
            aria-label="Resume timer"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={pause}
            className="ml-2 inline-flex items-center justify-center rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 h-7 w-7 sm:h-8 sm:w-8"
            title="Pause"
            aria-label="Pause timer"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Stopwatch;
