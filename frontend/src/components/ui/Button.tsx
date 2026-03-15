import React from 'react';

interface ButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'primary' | 'ghost' | 'nav-cta';
  children: React.ReactNode;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  const baseClass = variant === 'primary' 
    ? 'btn-primary' 
    : variant === 'ghost' 
    ? 'btn-ghost' 
    : variant === 'nav-cta'
    ? 'btn-nav-cta'
    : '';
  
  return (
    <a className={`${baseClass} ${className}`} {...props}>
      {children}
    </a>
  );
};
