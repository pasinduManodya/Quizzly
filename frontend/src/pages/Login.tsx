import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Background from '../components/LoginComponents/Background';
import Toast from '../components/LoginComponents/Toast';
import QuizzlyLogo from '../components/LoginComponents/QuizzlyLogo';
import LoginView from '../components/LoginComponents/LoginView';
import SignupView from '../components/LoginComponents/SignupView';
import ForgotPasswordView from '../components/LoginComponents/ForgotPasswordView';
import AdminLoginView from '../components/LoginComponents/AdminLoginView';
import '../styles/login.css';

type ViewType = 'login' | 'signup' | 'forgot' | 'admin';
type ToastType = 'err' | 'warn' | 'ok' | 'info';

interface ToastData {
  id: number;
  type: ToastType;
  title: string;
  msg: string;
  ms: number;
}

const Login: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/login/admin';
  const [currentView, setCurrentView] = useState<ViewType>(isAdminRoute ? 'admin' : 'login');
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => {
      if (isAdminRoute) {
        notify('info', 'Admin Panel', 'Enter your administrator credentials 🔐', 3500);
      } else {
        notify('info', 'Quizzly', 'Sign in to resume your learning streak ✨', 3500);
      }
    }, 600);
  }, [isAdminRoute]);

  const notify = (type: ToastType, title: string, msg: string, ms: number = 4000) => {
    const id = Date.now();
    const toast: ToastData = { id, type, title, msg, ms };
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, ms);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const goToView = (viewId: ViewType) => {
    if (currentView === viewId) return;
    setCurrentView(viewId);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      notify('ok', 'Signed in!', 'Welcome back - loading your dashboard.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (error: any) {
      notify('err', 'Login failed', error.message || 'Invalid credentials');
    }
  };

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      notify('ok', 'Admin access granted!', 'Loading admin dashboard...');
      // Navigate immediately with replace to prevent redirect loop
      navigate('/admin-dashboard', { replace: true });
    } catch (error: any) {
      notify('err', 'Admin login failed', error.message || 'Invalid admin credentials');
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    try {
      await signup(email, password);
      const firstName = name.split(' ')[0];
      notify('ok', 'Account created!', `Welcome, ${firstName}! Let's start learning.`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (error: any) {
      notify('err', 'Signup failed', error.message || 'Could not create account');
    }
  };

  const handleForgot = (email: string) => {
    notify('info', 'Reset link sent!', `Check your inbox at ${email}. May take a minute.`, 6000);
    setTimeout(() => goToView('login'), 1200);
  };

  const handleGuest = async () => {
    try {
      await login('', '', true);
      notify('info', 'Guest mode', "Progress won't be saved. Sign up anytime to keep it.", 5000);
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      notify('err', 'Guest login failed', error.message || 'Could not continue as guest');
    }
  };

  return (
    <div className="login-page-container">
      <Background />
      
      <Link to="/" className="btn-home">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1.5L3.5 6 8 10.5"/>
        </svg>
        Back to home
      </Link>

      <div id="toasts">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            msg={toast.msg}
            ms={toast.ms}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      <div className="wrap">
        <div className="card" id="card">
          <QuizzlyLogo />

          {currentView === 'login' && (
            <LoginView
              onLogin={handleLogin}
              onGuest={handleGuest}
              onSwitchToSignup={() => goToView('signup')}
              onForgotPassword={() => goToView('forgot')}
              notify={notify}
            />
          )}

          {currentView === 'signup' && (
            <SignupView
              onSignup={handleSignup}
              onSwitchToLogin={() => goToView('login')}
              notify={notify}
            />
          )}

          {currentView === 'forgot' && (
            <ForgotPasswordView
              onForgot={handleForgot}
              onBackToLogin={() => goToView('login')}
              notify={notify}
            />
          )}

          {currentView === 'admin' && (
            <AdminLoginView
              onLogin={handleAdminLogin}
              notify={notify}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
