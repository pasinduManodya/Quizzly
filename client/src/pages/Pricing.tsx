import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  dailyLimit: number;
  monthlyLimit: number;
  features: string[];
  popular?: boolean;
  color: string;
}

const Pricing: React.FC = () => {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([
    {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: '$',
      period: 'forever',
      dailyLimit: 3,
      monthlyLimit: 10,
      features: [
        '3 PDF uploads per day',
        '10 PDF uploads per month',
        'Basic MCQ quizzes',
        'AI-powered feedback',
        'Save favorites',
        'Guest access'
      ],
      color: 'teal'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 9.99,
      currency: '$',
      period: 'month',
      dailyLimit: 20,
      monthlyLimit: 100,
      features: [
        '20 PDF uploads per day',
        '100 PDF uploads per month',
        'MCQ + Essay quizzes',
        'Advanced AI feedback',
        'Unlimited favorites',
        'Priority support',
        'Export quiz results'
      ],
      popular: true,
      color: 'violet'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 19.99,
      currency: '$',
      period: 'month',
      dailyLimit: 50,
      monthlyLimit: 500,
      features: [
        '50 PDF uploads per day',
        '500 PDF uploads per month',
        'All quiz types (MCQ, Essay, Mixed)',
        'Premium AI feedback',
        'Unlimited favorites',
        '24/7 priority support',
        'Export & analytics',
        'Custom quiz templates',
        'API access'
      ],
      color: 'yellow'
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch pricing plans from API
    const fetchPricingPlans = async () => {
      try {
        const response = await fetch('/api/pricing/plans');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.plans) {
            setPricingPlans(data.plans);
          }
        }
      } catch (error) {
        console.error('Failed to fetch pricing plans:', error);
        // Keep default plans if API fails
      } finally {
        setLoading(false);
      }
    };

    fetchPricingPlans();
  }, []);

  const getColorClasses = (color: string) => {
    const colorMap = {
      teal: {
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        button: 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
        text: 'text-teal-600',
        badge: 'bg-teal-100 text-teal-800'
      },
      violet: {
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        button: 'bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700',
        text: 'text-violet-600',
        badge: 'bg-violet-100 text-violet-800'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        button: 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
        text: 'text-yellow-600',
        badge: 'bg-yellow-100 text-yellow-800'
      }
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.teal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-teal-50/30 to-violet-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

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
          
          .animate-fade-in-up {
            animation: fade-in-up 0.8s ease-out;
          }
          
          .animate-fade-in-left {
            animation: fade-in-left 0.8s ease-out;
          }
          
          .animate-fade-in-right {
            animation: fade-in-right 0.8s ease-out;
          }
        `
      }} />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-teal-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <Logo className="h-10 w-10 rounded-xl object-cover" size={40} />
            <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-violet-600 bg-clip-text text-transparent">
              Quizzly
            </span>
          </Link>
          <nav className="hidden sm:flex items-center space-x-6">
            <Link to="/about" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">About</Link>
            <Link to="/pricing" className="text-teal-600 font-semibold">Pricing</Link>
            <Link to="/contact" className="text-gray-600 hover:text-teal-600 transition-colors font-medium">Contact</Link>
            <Link to="/login" className="bg-gradient-to-r from-teal-500 to-violet-600 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105">
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 via-white to-violet-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6">
              Choose Your Perfect
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-violet-600 to-teal-600 bg-clip-text text-transparent">
                Study Plan
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Start free and upgrade as you grow. All plans include AI-powered quizzes and smart feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => {
              const colors = getColorClasses(plan.color);
              const animationClass = index === 0 ? 'animate-fade-in-left' : 
                                   index === 1 ? 'animate-fade-in-up' : 
                                   'animate-fade-in-right';
              
              return (
                <div 
                  key={plan.id}
                  className={`${animationClass} relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 ${plan.popular ? 'border-violet-300 ring-4 ring-violet-100' : colors.border}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-violet-500 to-violet-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="p-8">
                    {/* Plan Header */}
                    <div className="text-center mb-8">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-5xl font-extrabold text-gray-900">{plan.currency}{plan.price}</span>
                        <span className="text-gray-600 ml-2">/{plan.period}</span>
                      </div>
                      <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${colors.badge}`}>
                        {plan.dailyLimit} PDFs/day • {plan.monthlyLimit} PDFs/month
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      to="/login"
                      className={`w-full ${colors.button} text-white py-4 rounded-2xl font-bold text-lg text-center block transition-all duration-300 hover:shadow-lg hover:scale-105`}
                    >
                      {plan.price === 0 ? 'Start Free' : `Get ${plan.name}`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-teal-50/50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about our pricing
            </p>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Can I change my plan anytime?</h3>
              <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What happens if I exceed my limits?</h3>
              <p className="text-gray-600">If you exceed your daily or monthly limits, you'll be notified and can either wait for the reset or upgrade your plan for more capacity.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Is there a free trial for paid plans?</h3>
              <p className="text-gray-600">Yes! All paid plans come with a 7-day free trial. You can cancel anytime during the trial period without being charged.</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Do you offer student discounts?</h3>
              <p className="text-gray-600">Yes! Students with valid .edu email addresses get 50% off all paid plans. Contact our support team to verify your student status.</p>
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
              Ready to Study Smarter?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
              Join thousands of students who are already studying smarter with AI-powered quizzes
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/login" 
                className="bg-white text-teal-600 px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-gray-50"
              >
                🎯 Start Free Trial
              </Link>
              <Link 
                to="/contact" 
                className="bg-white/20 backdrop-blur text-white px-8 py-4 rounded-2xl font-bold text-lg border-2 border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105"
              >
                💬 Contact Sales
              </Link>
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
              <Link to="/pricing" className="text-white font-semibold">Pricing</Link>
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

export default Pricing;
