import React from 'react';
import { Link } from 'react-router-dom';
import PWAInstallButton from '../components/PWAInstallButton';
import Logo from '../components/Logo';

const Landing: React.FC = () => {
  React.useEffect(() => {
    // Cleanup: just log that we're on landing page
    console.log('Landing page loaded');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-teal-50/30 to-violet-50/30">
      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fade-in-left {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fade-in-right {
            from {
              opacity: 0;
              transform: translateX(30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          
          @keyframes float-delay {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-15px);
            }
          }
          
          @keyframes float-slow {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
          }
          
          .animate-fade-in-left {
            animation: fade-in-left 0.8s ease-out;
          }
          
          .animate-fade-in-right {
            animation: fade-in-right 0.8s ease-out;
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-float-delay {
            animation: float-delay 8s ease-in-out infinite;
          }
          
          .animate-float-slow {
            animation: float-slow 10s ease-in-out infinite;
          }
        `
      }} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-teal-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo className="h-10 w-10 rounded-xl object-cover" size={40} />
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent">
              Quizzly
            </span>
          </div>
          <nav className="hidden sm:flex items-center space-x-6">
            <Link to="/about" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">About</Link>
            <Link to="/pricing" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Pricing</Link>
            <Link to="/contact" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact</Link>
            <Link to="/login" className="bg-gradient-to-r from-teal-500 to-violet-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-violet-50 py-20 md:py-32">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-20 h-20 bg-teal-200/30 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-violet-200/30 rounded-full animate-float-delay"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-yellow-200/40 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-40 right-1/3 w-14 h-14 bg-teal-300/20 rounded-full animate-float"></div>
          <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-violet-300/30 rounded-full animate-float-delay"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6">
              Turn Your Notes into
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
                Smart Quizzes
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Upload your PDFs and let AI turn them into smart, personalized quizzes with instant feedback and easy revision
            </p>
          </div>
          
          <div className="animate-fade-in-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link 
              to="/login" 
              className="bg-gradient-to-r from-teal-500 to-violet-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:from-teal-600 hover:to-violet-700"
            >
              🚀 Start Free
            </Link>
            <Link 
              to="/login" 
              className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-teal-200 hover:border-teal-400 hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              👤 Continue as Guest
            </Link>
            <PWAInstallButton />
          </div>
          
          <div className="animate-fade-in-up text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 inline-block">
            ✨ Guest users can upload up to 3 PDFs for free
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Study Smarter
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built for students, designed for focus and success
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="animate-fade-in-left bg-gradient-to-br from-teal-50 to-teal-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Upload PDFs</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Simply drag and drop your study materials. Our AI instantly processes your PDFs and extracts key concepts for quiz generation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="animate-fade-in-up bg-gradient-to-br from-violet-50 to-violet-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Generate AI Quizzes</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Choose from Multiple Choice Questions, Essay questions, or Mixed formats. Our AI creates personalized quizzes based on your content.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="animate-fade-in-right bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Smart Feedback</h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Receive instant, detailed explanations for every answer. Learn not just what's correct, but why it's correct.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Students Love It */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why Students Love It
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of students who are studying smarter, not harder
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="animate-fade-in-left bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-teal-100">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personalized</h3>
              <p className="text-gray-600">AI adapts to your learning style and creates quizzes tailored to your needs.</p>
            </div>

            {/* Card 2 */}
            <div className="animate-fade-in-up bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-violet-100">
              <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Instant Explanations</h3>
              <p className="text-gray-600">Get immediate feedback and detailed explanations for every question.</p>
            </div>

            {/* Card 3 */}
            <div className="animate-fade-in-up bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-yellow-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Save Favorites</h3>
              <p className="text-gray-600">Mark difficult questions as favorites and revisit them for better retention.</p>
            </div>

            {/* Card 4 */}
            <div className="animate-fade-in-right bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-teal-100">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Guest Access</h3>
              <p className="text-gray-600">Try it out with 3 free PDF uploads - no registration required!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-teal-500 via-violet-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Start Learning Smarter Today
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of students who are already studying smarter with AI-powered quizzes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/login" 
                className="bg-white text-teal-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-gray-50"
              >
                🎯 Get Started Free
              </Link>
              <Link 
                to="/login" 
                className="bg-white/20 backdrop-blur text-white px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105"
              >
                👤 Try as Guest
              </Link>
              <div className="mt-4 sm:mt-0">
                <PWAInstallButton />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Logo className="h-8 w-8 rounded-lg object-cover mr-3" size={32} />
              <h3 className="text-xl font-bold">Quizzly</h3>
            </div>
            
            <div className="flex flex-wrap justify-center space-x-6 mb-6">
              <Link to="/about" className="text-gray-300 hover:text-white transition-colors duration-200">About</Link>
              <Link to="/pricing" className="text-gray-300 hover:text-white transition-colors duration-200">Pricing</Link>
              <Link to="/contact" className="text-gray-300 hover:text-white transition-colors duration-200">Contact</Link>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Privacy</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Terms</a>
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

export default Landing;
