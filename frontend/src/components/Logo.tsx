import React, { useState } from 'react';
import logoImage from '../assets/logo.jpg';

const Logo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 40 }) => {
  const [imgError, setImgError] = useState(false);
  
  // Try public folder first, then fallback to imported asset
  const logoSrc = imgError ? logoImage : `/logo.jpg?v=${Date.now()}`;
  
  return (
    <img 
      src={logoSrc}
      alt="Quizzly Logo" 
      className={className}
      style={{ 
        width: size, 
        height: size, 
        objectFit: 'cover'
      }}
      onError={() => {
        if (!imgError) {
          setImgError(true);
        }
      }}
    />
  );
};

export default Logo;

