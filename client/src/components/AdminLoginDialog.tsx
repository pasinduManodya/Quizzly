import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface AdminLoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminLoginDialog: React.FC<AdminLoginDialogProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      // Check if user is admin
      const userData = response.data.data?.user || response.data.user;
      if (userData.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Store token and user data
      localStorage.setItem('token', userData.token || response.data.data?.token);
      
      // Close dialog and navigate to admin dashboard
      onClose();
      navigate('/admin-dashboard');
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || 
                          error.response?.data?.message || 
                          error.message ||
                          'Login failed';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-red-600 mr-3 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white">
                <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3.12 7.214a1 1 0 01-.992-1.736l1.75-1a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.75 1a1 1 0 11-.992 1.736l.23-.132.23-.132zM14.017 9.149a1 1 0 01.372-1.364l1.75-1a1 1 0 11.992 1.736l-1.134.654a1 1 0 11-.992-1.736l.23-.132-.23-.132zm-8.764 0a1 1 0 00-.372-1.364l-1.75-1a1 1 0 10-.992 1.736l1.134.654a1 1 0 10.992-1.736l-.23-.132.23-.132zM17.25 16.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM4.75 16.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Admin Login</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter admin email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </button>
          </div>
        </form>

        <div className="px-6 py-3 bg-gray-50 border-t">
          <p className="text-xs text-gray-500 text-center">
            🔒 This is a secure admin login. Only authorized administrators can access.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginDialog;
