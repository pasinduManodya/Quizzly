import React from 'react';

interface BentoCardProps {
  icon?: {
    style: React.CSSProperties;
    svg: JSX.Element;
  };
  title?: string;
  body?: string;
  list?: string[];
  stat?: string;
  statSub?: string;
  bars?: number[];
  dark?: boolean;
  span: number;
  delay?: number;
}

export const BentoCard: React.FC<BentoCardProps> = ({ 
  icon, 
  title, 
  body, 
  list, 
  stat, 
  statSub, 
  bars, 
  dark, 
  span, 
  delay 
}) => {
  const spanClass = `bc s${span} reveal ${delay ? `d${delay}` : ''}`;
  
  return (
    <div className={`${spanClass} ${dark ? 'dark' : ''}`}>
      {icon && (
        <div className="bc-icon" style={icon.style}>
          {icon.svg}
        </div>
      )}
      
      {stat && (
        <>
          <div className="bc-stat">{stat}</div>
          <div className="bc-stat-sub">{statSub}</div>
        </>
      )}
      
      {title && <div className="bc-title">{title}</div>}
      {body && <div className="bc-body">{body}</div>}
      
      {list && (
        <ul className="bc-list">
          {list.map((item, idx) => (
            <li key={idx}>
              <div className="bc-dot"></div>
              {item}
            </li>
          ))}
        </ul>
      )}
      
      {bars && (
        <div className="mini-bars">
          {bars.map((height, idx) => (
            <div 
              key={idx} 
              className={`mb ${height > 65 ? 'hi' : ''}`} 
              style={{height: `${height}%`}}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
};
