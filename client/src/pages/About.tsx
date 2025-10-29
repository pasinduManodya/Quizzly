import React from 'react';
import Logo from '../components/Logo';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-500 to-violet-600">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              About Quizzly
            </h1>
            <p className="text-xl md:text-2xl text-teal-100 max-w-3xl mx-auto leading-relaxed animate-fade-in-delay">
              Helping students study smarter with AI-driven quizzes and instant feedback.
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white opacity-10 rounded-full animate-float"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white opacity-5 rounded-full animate-float-delay"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white opacity-10 rounded-full animate-float-slow"></div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Our Story
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-violet-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="bg-gradient-to-r from-teal-50 to-violet-50 rounded-2xl p-8 md:p-12 shadow-lg">
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center">
              Quizzly began as a simple student idea to revolutionize how we study. 
              We recognized that traditional study methods often feel monotonous and disconnected from 
              how students actually learn. Our vision was to create an intelligent study companion that 
              transforms static PDFs into dynamic, interactive learning experiences.
            </p>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center mt-6">
              By combining the power of artificial intelligence with thoughtful design, we've built 
              a platform that doesn't just help you study—it helps you study smarter, making AI your 
              personal study partner in the journey toward academic success.
            </p>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section className="py-20 bg-gradient-to-br from-violet-50 to-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Our Mission
          </h2>
          
          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-xl">
            <div className="text-6xl mb-6">🎯</div>
            <p className="text-2xl md:text-3xl text-gray-800 font-medium leading-relaxed">
              We aim to make learning more interactive, efficient, and personalized for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Core Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to transform your study materials into engaging learning experiences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Upload PDFs Easily</h3>
              <p className="text-gray-600">Simply drag and drop your study materials to get started</p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Question Generation</h3>
              <p className="text-gray-600">AI creates relevant questions tailored to your content</p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instant Feedback</h3>
              <p className="text-gray-600">Get immediate, detailed feedback on your answers</p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-gradient-to-br from-violet-50 to-violet-100 rounded-2xl p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Save Favorites</h3>
              <p className="text-gray-600">Bookmark important questions for easy revision</p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Learners Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-violet-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Built for Learners
          </h2>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 md:p-12">
            <div className="text-6xl mb-6">📚</div>
            <p className="text-xl md:text-2xl text-white leading-relaxed">
              Every design decision we make focuses on helping learners stay productive, 
              motivated, and confident in their academic journey.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Logo className="h-8 w-8 rounded-lg object-cover mr-3" size={32} />
              <h3 className="text-xl font-bold">Quizzly</h3>
            </div>
            
            <div className="flex flex-wrap justify-center space-x-6 mb-6">
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">About</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200">Contact</a>
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

      {/* Custom CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fade-in-delay {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
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
          
          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }
          
          .animate-fade-in-delay {
            animation: fade-in-delay 1s ease-out 0.3s both;
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
    </div>
  );
};

export default About;