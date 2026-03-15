import React from 'react';

interface SectionHeaderProps {
  eyebrow?: string;
  title?: string;
  body?: string;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  eyebrow, 
  title, 
  body, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
      {title && <h2 className="section-title" dangerouslySetInnerHTML={{ __html: title }} />}
      {body && <p className="section-body">{body}</p>}
    </div>
  );
};
