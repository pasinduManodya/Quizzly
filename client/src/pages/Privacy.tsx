import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-teal-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Logo className="h-10 w-10 rounded-xl object-cover" size={40} />
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent">
              Quizzly
            </span>
          </Link>
          
          <nav className="hidden sm:flex items-center space-x-6">
            <Link to="/about" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">About</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Pricing</Link>
            <Link to="/contact" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact</Link>
            <Link to="/privacy" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Privacy & Policy</Link>
            <Link to="/login" className="bg-gradient-to-r from-teal-500 to-violet-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
              Get Started
            </Link>
          </nav>

          <Link to="/" className="sm:hidden text-gray-600 hover:text-teal-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
        <div className="bg-white rounded-lg shadow-sm p-8 sm:p-12">
          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">Privacy & Policy</h1>
          <p className="text-gray-600 mb-8">Last updated: November 2025</p>

          {/* Table of Contents */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <ul className="space-y-2">
              <li><a href="#introduction" className="text-teal-600 hover:text-teal-700 font-medium">1. Introduction</a></li>
              <li><a href="#information-collection" className="text-teal-600 hover:text-teal-700 font-medium">2. Information We Collect</a></li>
              <li><a href="#information-usage" className="text-teal-600 hover:text-teal-700 font-medium">3. How We Use Your Information</a></li>
              <li><a href="#data-protection" className="text-teal-600 hover:text-teal-700 font-medium">4. Data Protection & Security</a></li>
              <li><a href="#user-rights" className="text-teal-600 hover:text-teal-700 font-medium">5. Your Rights</a></li>
              <li><a href="#third-party" className="text-teal-600 hover:text-teal-700 font-medium">6. Third-Party Services</a></li>
              <li><a href="#cookies" className="text-teal-600 hover:text-teal-700 font-medium">7. Cookies & Tracking</a></li>
              <li><a href="#contact" className="text-teal-600 hover:text-teal-700 font-medium">8. Contact Us</a></li>
            </ul>
          </div>

          {/* Content Sections */}
          <div className="space-y-8">
            {/* Introduction */}
            <section id="introduction">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to Quizzly ("we," "us," "our," or "Company"). We are committed to protecting your privacy and ensuring you have a positive experience on our platform. This Privacy & Policy document explains our practices regarding the collection, use, and protection of your personal information.
              </p>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Quizzly, you acknowledge that you have read, understood, and agree to be bound by all the terms and conditions outlined in this Privacy & Policy.
              </p>
            </section>

            {/* Information Collection */}
            <section id="information-collection">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">When you create an account or use our services, we may collect:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                    <li>Full name and email address</li>
                    <li>Password (encrypted)</li>
                    <li>Profile information and preferences</li>
                    <li>Educational background and learning goals</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Usage Information</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">We automatically collect information about your interactions with our platform:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2">
                    <li>Quiz performance and scores</li>
                    <li>Documents uploaded and study materials</li>
                    <li>Time spent on various features</li>
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Content You Provide</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Any documents, notes, or study materials you upload to Quizzly are stored securely on our servers to provide you with our services.
                  </p>
                </div>
              </div>
            </section>

            {/* Information Usage */}
            <section id="information-usage">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect for the following purposes:</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Service Delivery:</strong> To provide, maintain, and improve our quiz generation and learning features</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Personalization:</strong> To customize your learning experience and provide relevant recommendations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Communication:</strong> To send you updates, notifications, and support messages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Analytics:</strong> To analyze usage patterns and improve our platform</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">✓</span>
                  <span className="text-gray-700"><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</span>
                </li>
              </ul>
            </section>

            {/* Data Protection */}
            <section id="data-protection">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Protection & Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">🔒</span>
                  <span className="text-gray-700"><strong>Encryption:</strong> SSL/TLS encryption for data in transit and encryption for sensitive data at rest</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">🔒</span>
                  <span className="text-gray-700"><strong>Access Controls:</strong> Restricted access to personal information on a need-to-know basis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">🔒</span>
                  <span className="text-gray-700"><strong>Regular Audits:</strong> Periodic security assessments and vulnerability testing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">🔒</span>
                  <span className="text-gray-700"><strong>Secure Servers:</strong> Data stored on secure, monitored servers with backup systems</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            {/* User Rights */}
            <section id="user-rights">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">→</span>
                  <span className="text-gray-700"><strong>Right to Access:</strong> Request a copy of the personal information we hold about you</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">→</span>
                  <span className="text-gray-700"><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">→</span>
                  <span className="text-gray-700"><strong>Right to Deletion:</strong> Request deletion of your personal information (subject to legal obligations)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">→</span>
                  <span className="text-gray-700"><strong>Right to Opt-Out:</strong> Opt out of marketing communications and data processing for non-essential purposes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 font-bold mr-3">→</span>
                  <span className="text-gray-700"><strong>Right to Data Portability:</strong> Request your data in a structured, commonly used format</span>
                </li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at the email address provided in the Contact Us section.
              </p>
            </section>

            {/* Third-Party Services */}
            <section id="third-party">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Quizzly integrates with third-party AI services (such as OpenAI, Google Gemini, and Anthropic Claude) to provide quiz generation and explanation features. When you use these features:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-2 mb-4">
                <li>Your study materials may be sent to these third-party services for processing</li>
                <li>These services have their own privacy policies and data handling practices</li>
                <li>We recommend reviewing their privacy policies at their respective websites</li>
                <li>We do not share your personal account information with these services</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                We are not responsible for the privacy practices of third-party services. Please review their privacy policies before using our platform.
              </p>
            </section>

            {/* Cookies & Tracking */}
            <section id="cookies">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies & Tracking</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience on Quizzly:
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">Required for authentication, security, and basic platform functionality</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Preference Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">Remember your settings and preferences to personalize your experience</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                  <p className="text-gray-700 leading-relaxed">Help us understand how users interact with our platform to improve services</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed mt-4">
                You can control cookie settings through your browser preferences. Disabling cookies may affect some platform functionality.
              </p>
            </section>

            {/* Contact Us */}
            <section id="contact">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you have questions, concerns, or requests regarding this Privacy & Policy or our privacy practices, please contact us:
              </p>
              <div className="bg-gray-100 rounded-lg p-6 mb-4">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@quizzly.com</p>
                <p className="text-gray-700 mb-2"><strong>Support:</strong> support@quizzly.com</p>
                <p className="text-gray-700"><strong>Response Time:</strong> We aim to respond to all inquiries within 7 business days</p>
              </div>
            </section>

            {/* Policy Changes */}
            <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Policy Changes</h3>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy & Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by email or by posting a prominent notice on our platform. Your continued use of Quizzly after any modifications constitutes your acceptance of the updated policy.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Logo className="h-8 w-8 rounded-lg object-cover mr-3" size={32} />
              <h3 className="text-xl font-bold">Quizzly</h3>
            </div>
            
            <div className="flex flex-wrap justify-center space-x-6 mb-6 text-sm">
              <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-200">About</Link>
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors duration-200">Pricing</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">Contact</Link>
              <Link to="/privacy" className="text-gray-300 hover:text-white transition-colors duration-200">Privacy & Policy</Link>
            </div>
            
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400">
                © 2025 Quizzly. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
