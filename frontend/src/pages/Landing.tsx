import React, { useState } from 'react';
import { LandingNav } from '../components/LandingNav';
import { Hero } from '../components/Hero/Hero';
import { About } from '../components/About/About';
import { Pricing } from '../components/Pricing/Pricing';
import { Contact } from '../components/Contact/Contact';
import { LandingFooter } from '../components/LandingFooter';
import { LandingModal } from '../components/LandingModal';
import { useScrollEffects } from '../hooks/useScrollEffects';
import '../styles/landing.css';

const Landing: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useScrollEffects();

  const handleOpenModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="landing-page">
      <LandingNav onOpenModal={handleOpenModal} />
      <Hero />
      <About />
      <Pricing />
      <Contact />
      <LandingFooter onOpenModal={handleOpenModal} />
      <LandingModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default Landing;
