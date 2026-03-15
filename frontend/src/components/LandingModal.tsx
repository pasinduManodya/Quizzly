import React, { useEffect } from 'react';
import { Icon } from './ui/Icon';

interface LandingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandingModal: React.FC<LandingModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`modal-bd ${isOpen ? 'open' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className="modal-box">
        <div className="modal-hd">
          <div className="modal-hd-row">
            <h2 className="modal-ttl">Privacy &amp; Policy</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <Icon type="close" />
            </button>
          </div>
        </div>
        <div className="modal-body">
          <h3>Information We Collect</h3>
          <p>We collect information you provide directly to us, such as when you create an account, participate in quizzes, or contact us for support.</p>
          
          <h3>How We Use Your Information</h3>
          <p>We use the information we collect to provide, maintain, and improve our services, to develop new features, and to protect Quizzly and our users.</p>
          
          <h3>Information Sharing</h3>
          <p>We do not share your personal information with third parties except as described in this policy or with your consent.</p>
          
          <h3>Data Security</h3>
          <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.</p>
          
          <h3>Your Rights</h3>
          <p>You have the right to access, update, or delete your personal information at any time through your account settings.</p>
          
          <h3>Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@quizzly.io.</p>
        </div>
      </div>
    </div>
  );
};
