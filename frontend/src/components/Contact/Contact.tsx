import React from 'react';
import { SectionHeader } from '../ui/SectionHeader';
import { ContactInfo } from './ContactInfo';
import { ContactForm } from './ContactForm';

export const Contact: React.FC = () => {
  return (
    <section id="contact">
      <div className="bg-layer">
        <div className="geo-blob" style={{width: '400px', height: '400px', top: '-80px', right: '-80px', background: 'rgba(67,97,238,0.05)'}}></div>
        <div className="dot-grid" style={{opacity: '.35'}}></div>
      </div>
      
      <div className="container">
        <div className="reveal">
          <SectionHeader
            eyebrow="Contact"
            title="We're here to help"
            body="Questions, partnerships or enterprise enquiries — our team typically responds within two hours on business days."
          />
        </div>
        
        <div className="contact-grid">
          <div className="reveal">
            <ContactInfo />
          </div>
          <ContactForm />
        </div>
      </div>
    </section>
  );
};
