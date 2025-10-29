import React from 'react';

const Logo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 40 }) => {
  // Add cache-busting query parameter
  const logoSrc = `/logo.jpg?v=${Date.now()}`;
  
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
    />
  );
};

export default Logo;

