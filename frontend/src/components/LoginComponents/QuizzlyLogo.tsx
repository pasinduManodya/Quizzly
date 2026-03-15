import React from 'react';

function QuizzlyLogo() {
  return (
    <div className="logo-row">
      <div className="logo-mark">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="8" fill="#2ebfa0"/>
          <path d="M20 10L28 15V25L20 30L12 25V15L20 10Z" fill="white" fillOpacity="0.9"/>
          <circle cx="20" cy="20" r="3" fill="#2ebfa0"/>
        </svg>
      </div>
      <div className="logo-word">Quizz<span>ly</span></div>
    </div>
  );
}

export default QuizzlyLogo;
