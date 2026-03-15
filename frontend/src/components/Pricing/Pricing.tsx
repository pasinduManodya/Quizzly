import React, { useState } from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { PriceCard } from './PriceCard';

export const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      icon: (
        <svg viewBox="0 0 18 18" style={{ stroke: 'var(--blue)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 2v4M9 12v4M2 9h4M12 9h4M4.2 4.2l2.8 2.8M11 11l2.8 2.8M4.2 13.8L7 11M11 7l2.8-2.8"/>
        </svg>
      ),
      price: { monthly: 0, annual: 0 },
      description: 'For curious learners exploring at their own pace with no commitment required.',
      features: [
        { text: '50 quizzes per month', included: true },
        { text: '5 subject categories', included: true },
        { text: 'Basic progress tracking', included: true },
        { text: 'AI adaptive learning', included: false },
        { text: 'Advanced analytics', included: false }
      ],
      buttonText: 'Get started free',
      buttonVariant: 'outline' as const
    },
    {
      name: 'Pro',
      icon: (
        <svg viewBox="0 0 18 18" style={{ stroke: 'rgba(255,255,255,0.7)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 1l2.5 5.5 5.5.8-4 3.9.9 5.5L9 14l-4.9 2.7.9-5.5-4-3.9 5.5-.8z"/>
        </svg>
      ),
      price: { monthly: 12, annual: 8 },
      description: 'For serious learners who want the complete Quizzly experience.',
      features: [
        { text: 'Unlimited quizzes', included: true },
        { text: 'All 50+ subject categories', included: true },
        { text: 'AI adaptive learning', included: true },
        { text: 'Full analytics dashboard', included: true },
        { text: 'Study rooms (up to 5)', included: true }
      ],
      buttonText: 'Get Pro',
      buttonVariant: 'solid' as const,
      featured: true
    },
    {
      name: 'Teams',
      icon: (
        <svg viewBox="0 0 18 18" style={{ stroke: 'var(--blue)' }}>
          <circle cx="6.5" cy="5" r="2.5"/>
          <circle cx="11.5" cy="5" r="2.5"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 15c0-3 2.5-4.5 5.5-4.5S12 12 12 15M11 10.5c1.5-.2 3 .7 5 4.5"/>
        </svg>
      ),
      price: { monthly: 39, annual: 27 },
      description: 'For schools, tutors and organisations that learn and grow together.',
      features: [
        { text: 'Everything in Pro', included: true },
        { text: 'Up to 30 members', included: true },
        { text: 'Custom quiz builder', included: true },
        { text: 'Team analytics & admin', included: true },
        { text: 'Priority support & API', included: true }
      ],
      buttonText: 'Contact sales',
      buttonVariant: 'outline' as const
    }
  ];

  return (
    <section id="pricing">
      <div className="bg-layer">
        <div className="geo-blob" style={{width: '600px', height: '600px', bottom: '-200px', right: '-100px', background: 'rgba(67,97,238,0.04)'}}></div>
        <div className="dot-grid" style={{opacity: '.45'}}></div>
      </div>
      
      <div className="container">
        <SectionHeader
          className="pricing-hd reveal"
          eyebrow="Pricing"
          title="Simple, transparent plans"
          body="Start free and scale as your ambitions grow. No lock-ins, no hidden costs."
        />
        
        <div className="bill-toggle reveal">
          <span className={`bill-opt ${!isAnnual ? 'active' : ''}`}>Monthly</span>
          <button 
            className={`toggle-pill ${isAnnual ? 'on' : ''}`} 
            onClick={() => setIsAnnual(!isAnnual)}
            aria-label="Toggle annual"
          ></button>
          <span className={`bill-opt ${isAnnual ? 'active' : ''}`}>Annual</span>
          <span className="save-tag">Save 30%</span>
        </div>
        
        <div className="price-grid reveal">
          {plans.map((plan, idx) => (
            <PriceCard key={idx} {...plan} isAnnual={isAnnual} />
          ))}
        </div>
      </div>
    </section>
  );
};
