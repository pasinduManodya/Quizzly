import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './ui/Icon';

interface LandingFooterProps {
  onOpenModal: (e: React.MouseEvent) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onOpenModal }) => {
  const socialButtons = [
    {
      label: 'X / Twitter',
      icon: (
        <svg viewBox="0 0 14 14">
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1l5.5 6L1 13h2l4-4.5L11 13h2L7.5 7 13 1h-2L7 5.5 3 1z"/>
        </svg>
      )
    },
    {
      label: 'LinkedIn',
      icon: (
        <svg viewBox="0 0 14 14">
          <rect x="1" y="1" width="4" height="12" rx="0.5"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 5v8M7 8a3.5 3.5 0 017 0v5"/>
        </svg>
      )
    },
    {
      label: 'GitHub',
      icon: (
        <svg viewBox="0 0 14 14">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 1a6 6 0 00-1.9 11.7c.3.05.4-.13.4-.3v-1.05c-1.67.36-2.02-.8-2.02-.8a1.59 1.59 0 00-.67-.88c-.55-.37.04-.36.04-.36a1.26 1.26 0 01.92.62 1.28 1.28 0 001.75.5 1.28 1.28 0 01.38-.8c-1.34-.15-2.74-.67-2.74-2.97a2.3 2.3 0 01.62-1.62 2.16 2.16 0 01.06-1.6s.5-.16 1.65.62a5.67 5.67 0 013 0c1.14-.78 1.64-.62 1.64-.62a2.16 2.16 0 01.06 1.6 2.3 2.3 0 01.61 1.62c0 2.31-1.41 2.82-2.75 2.97a1.43 1.43 0 01.41 1.12v1.65c0 .17.1.36.41.3A6 6 0 007 1z"/>
        </svg>
      )
    },
    {
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 14 14">
          <rect x="1" y="3" width="12" height="8" rx="1.5"/>
          <path d="M5.5 5l4 2-4 2V5z" fill="rgba(255,255,255,0.6)" stroke="none"/>
        </svg>
      )
    }
  ];

  const footerLinks = {
    product: [
      { text: 'Features', href: '#about' },
      { text: 'Pricing', href: '#pricing' },
      { text: 'For Schools', href: '#' },
      { text: 'Changelog', href: '#' },
      { text: 'Roadmap', href: '#' }
    ],
    company: [
      { text: 'About us', href: '/about' },
      { text: 'Blog', href: '#' },
      { text: 'Careers', href: '#' },
      { text: 'Contact', href: '#contact' },
      { text: 'Press kit', href: '#' }
    ],
    legal: [
      { text: 'Privacy & Policy', href: '#', onClick: onOpenModal },
      { text: 'Terms of Service', href: '#' },
      { text: 'Cookie Policy', href: '#' },
      { text: 'GDPR', href: '#' },
      { text: 'Security', href: '#' }
    ]
  };

  return (
    <footer>
      <div className="container">
        <div className="foot-grid">
          <div>
            <div className="foot-logo">
              <img src="/Logo_Final.svg" alt="Quizzly Logo" style={{ width: '144px', height: 'auto', maxHeight: '40px', filter: 'invert(1) brightness(2)' }} />
            </div>
            <p className="foot-desc">
              Making learning engaging, effective and lasting for students and professionals worldwide.
            </p>
            <div className="socials">
              {socialButtons.map((social, idx) => (
                <button key={idx} className="s-btn" aria-label={social.label}>
                  {social.icon}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="foot-col-ttl">Product</div>
            <ul className="foot-links">
              {footerLinks.product.map((link, idx) => (
                <li key={idx}><a href={link.href}>{link.text}</a></li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="foot-col-ttl">Company</div>
            <ul className="foot-links">
              {footerLinks.company.map((link, idx) => (
                <li key={idx}>
                  {link.href.startsWith('/') ? (
                    <Link to={link.href}>{link.text}</Link>
                  ) : (
                    <a href={link.href}>{link.text}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="foot-col-ttl">Legal</div>
            <ul className="foot-links">
              {footerLinks.legal.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} onClick={link.onClick}>
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="foot-bot">
          <div className="foot-copy">© 2025 Quizzly Inc. All rights reserved.</div>
          <div className="foot-legal">
            <a href="#" onClick={onOpenModal}>Privacy &amp; Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
