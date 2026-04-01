import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './ui/Icon';

interface LandingNavProps {
  onOpenModal: (e: React.MouseEvent) => void;
}

export const LandingNav: React.FC<LandingNavProps> = ({ onOpenModal }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav id="nav" className={scrolled ? 'scrolled' : ''}>
      <div className="container">
        <div className="nav-inner">
          <a href="#" className="logo">
            <img src="/Logo_Full.png" alt="Quizzly Logo" style={{ maxHeight: '40px', height: 'auto' }} />
          </a>
          
          <ul className="nav-links">
            <li><a href="#about">About</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#" onClick={onOpenModal}>Privacy &amp; Policy</a></li>
          </ul>
          
          <Link to="/login" className="btn-nav-cta">
            Get Started
            <Icon type="arrow" />
          </Link>
          
          <button 
            className={`ham ${mobileMenuOpen ? 'open' : ''}`} 
            onClick={toggleMobileMenu}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
      
      <div className={`mob-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#about" onClick={closeMobileMenu}>About</a>
        <a href="#pricing" onClick={closeMobileMenu}>Pricing</a>
        <a href="#contact" onClick={closeMobileMenu}>Contact</a>
        <a href="#" onClick={(e) => { onOpenModal(e); closeMobileMenu(); }}>Privacy &amp; Policy</a>
        <Link to="/login" className="m-cta" onClick={closeMobileMenu}>Get Started</Link>
      </div>
    </nav>
  );
};
