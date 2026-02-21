import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const CommonHeader: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-teal-100/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <Logo className="h-10 w-10 rounded-xl object-cover" size={40} />
          <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent">
            Quizzly
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden sm:flex items-center space-x-6">
          <Link to="/about" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">About</Link>
          <Link to="/pricing" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Pricing</Link>
          <Link to="/contact" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact</Link>
          <Link to="/privacy" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Privacy & Policy</Link>
          <Link to="/login" className="bg-gradient-to-r from-teal-500 to-violet-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500 transition-colors"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          {!mobileMenuOpen ? (
            <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ) : (
            <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-teal-100/50 bg-white/95 backdrop-blur-md">
          <div className="px-6 pt-2 pb-4 space-y-1">
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              About
            </Link>
            <Link
              to="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-base font-medium text-gray-700 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
            >
              Privacy & Policy
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-3 text-base font-semibold text-white bg-gradient-to-r from-teal-500 to-violet-600 rounded-lg hover:shadow-lg transition-all duration-200 text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default CommonHeader;
