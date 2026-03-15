import React from 'react';
import { Link } from 'react-router-dom';

interface Feature {
  text: string;
  included: boolean;
}

interface PriceCardProps {
  name: string;
  icon: JSX.Element;
  price: { monthly: number; annual: number };
  description: string;
  features: Feature[];
  buttonText: string;
  buttonVariant?: 'outline' | 'solid';
  featured?: boolean;
  isAnnual: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({ 
  name, 
  icon, 
  price, 
  description, 
  features, 
  buttonText, 
  buttonVariant = 'outline',
  featured = false,
  isAnnual 
}) => {
  const displayPrice = isAnnual ? price.annual : price.monthly;
  
  return (
    <div className={`price-card ${featured ? 'feat' : ''}`}>
      {featured && <div className="feat-badge">Most Popular</div>}
      
      <div className="p-icon">
        {icon}
      </div>
      
      <div className="p-name">{name}</div>
      
      <div className="p-row">
        <span className="p-curr">$</span>
        <span className="p-num" data-m={price.monthly} data-a={price.annual}>
          {displayPrice}
        </span>
        <span className="p-per">/ month</span>
      </div>
      
      <div className="p-desc">{description}</div>
      
      <div className="p-divider"></div>
      
      <ul className="p-feat">
        {features.map((feature, idx) => (
          <li key={idx} className={feature.included ? 'on' : ''}>
            <div className="fi">
              <svg viewBox="0 0 9 9">
                {feature.included ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 4.5l2 2 4-4"/>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2 2l5 5M7 2l-5 5"/>
                )}
              </svg>
            </div>
            {feature.text}
          </li>
        ))}
      </ul>
      
      <Link 
        to="/login" 
        className={`p-btn ${buttonVariant === 'solid' ? 'p-btn-solid' : 'p-btn-ol'}`}
      >
        {buttonText}
      </Link>
    </div>
  );
};
