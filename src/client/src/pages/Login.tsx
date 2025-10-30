import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminLoginDialog from '../components/AdminLoginDialog';
import Logo from '../components/Logo';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Minimal page: email + password only

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Logo className="h-8 w-8 rounded-lg object-cover mr-2" size={32} />
            <h1 className="text-xl font-semibold">Quizzly</h1>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm bg-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 9.414V17a1 1 0 001 1h3a1 1 0 001-1v-3h2v3a1 1 0 001 1h3a1 1 0 001-1V9.414l.293.293a1 1 0 001.414-1.414l-7-7z" clipRule="evenodd"/></svg>
            Back to Home
          </Link>
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-900">Sign in</h2>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-t-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-500 text-gray-900 rounded-b-lg focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 text-sm font-medium btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">New here?</span>
            <Link to="/signup" className="text-primary hover:text-primary-dark">Create an account</Link>
          </div>
          <div className="text-center text-sm">
            <span className="text-gray-600">Or </span>
            <button
              type="button"
              onClick={async () => { try { await login('', '', true); navigate('/dashboard'); } catch (e:any) { setError(e.message);} }}
              className="text-primary hover:text-primary-dark"
            >
              continue as guest
            </button>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowAdminDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3.12 7.214a1 1 0 01-.992-1.736l1.75-1a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.75 1a1 1 0 11-.992 1.736l-1.134.654a1 1 0 11-.992-1.736l.23-.132.23-.132zM14.017 9.149a1 1 0 01.372-1.364l1.75-1a1 1 0 11.992 1.736l-1.134.654a1 1 0 11-.992-1.736l.23-.132-.23-.132zm-8.764 0a1 1 0 00-.372-1.364l-1.75-1a1 1 0 10-.992 1.736l1.134.654a1 1 0 10.992-1.736l-.23-.132.23-.132zM17.25 16.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM4.75 16.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd"/>
              </svg>
              Admin Panel
            </button>
            <p className="text-xs text-gray-500 mt-2">Click to open admin login dialog</p>
          </div>
        </form>
      </div>
      
      <AdminLoginDialog 
        isOpen={showAdminDialog} 
        onClose={() => setShowAdminDialog(false)} 
      />
    </div>
  );
};

export default Login;
