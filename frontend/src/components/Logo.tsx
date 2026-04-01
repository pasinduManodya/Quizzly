import React from 'react';

const Logo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 144 }) => {
  return (
    <img 
      src="/Logo_Final.svg"
      alt="Quizzly Logo" 
      className={className}
      style={{ 
        width: size, 
        height: 'auto',
        maxHeight: '40px',
        objectFit: 'contain'
      }}
    />
  );
};

export default Logo;

