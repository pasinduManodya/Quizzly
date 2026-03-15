import React from 'react';

interface IconProps {
  type: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({ type, className = '', style = {} }) => {
  const icons: Record<string, JSX.Element> = {
    arrow: (
      <svg viewBox="0 0 14 14" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M1 7h12M8 3l5 4-5 4"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 14 14" className={className} style={style}>
        <circle cx="7" cy="7" r="6"/>
        <path strokeLinecap="round" d="M5.5 7l1.5 1.5L9.5 6"/>
      </svg>
    ),
    checkmark: (
      <svg viewBox="0 0 16 16" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l3.5 3.5L13 5"/>
      </svg>
    ),
    logo: (
      <svg viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
        <rect x="2" y="2" width="6" height="6" rx="1.5" fill="white"/>
        <rect x="10" y="2" width="6" height="6" rx="1.5" fill="white" opacity="0.5"/>
        <rect x="2" y="10" width="6" height="6" rx="1.5" fill="white" opacity="0.5"/>
        <rect x="10" y="10" width="6" height="6" rx="1.5" fill="white"/>
      </svg>
    ),
    close: (
      <svg viewBox="0 0 13 13" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l9 9M11 2l-9 9"/>
      </svg>
    ),
    email: (
      <svg viewBox="0 0 16 16" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 4l6 4 6-4M2 4h12v9a1 1 0 01-1 1H3a1 1 0 01-1-1V4z"/>
      </svg>
    ),
    location: (
      <svg viewBox="0 0 16 16" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 1C5.2 1 3 3.2 3 6c0 3.8 5 9 5 9s5-5.2 5-9c0-2.8-2.2-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"/>
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 16 16" className={className} style={style}>
        <circle cx="8" cy="8" r="6"/>
        <path strokeLinecap="round" d="M8 5v3.5l2.5 1.5"/>
      </svg>
    ),
    message: (
      <svg viewBox="0 0 16 16" className={className} style={style}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 2h8a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 3V11H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
      </svg>
    ),
  };

  return icons[type] || null;
};
