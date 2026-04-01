import React, { useEffect, useState } from 'react';
import '../styles/splash.css';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'Beat Your Best';

  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 50);

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 800);
    }, 3000);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <img 
            src="/Logo_Final.svg" 
            alt="Quizzly Logo" 
            className="splash-logo"
          />
        </div>
        <div className="splash-slogan">
          {displayedText}
          <span className="cursor-blink">|</span>
        </div>
        <div className="splash-loader">
          <div className="loader-bar"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
