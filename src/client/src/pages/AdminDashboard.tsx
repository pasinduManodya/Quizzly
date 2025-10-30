import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AIConfiguration from '../components/AIConfiguration';
import UsersTab from '../components/UsersTab';
import TokenLimitsTab from '../components/TokenLimitsTab';
import AnalyticsOverview from '../components/AnalyticsOverview';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user is authenticated and is admin
    const checkAdminAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // Set the token for axios requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Check if user is admin
        const response = await axios.get('/api/auth/me');
        const user = response.data.data?.user || response.data.user;
        
        if (user.role !== 'admin') {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        setLoading(false);
      } catch (error) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    };

    checkAdminAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-red-600 mr-3 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-white">
                  <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3.12 7.214a1 1 0 01-.992-1.736l1.75-1a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.75 1a1 1 0 11-.992 1.736l.23-.132.23-.132zM14.017 9.149a1 1 0 01.372-1.364l1.75-1a1 1 0 11.992 1.736l-1.134.654a1 1 0 11-.992-1.736l.23-.132-.23-.132zm-8.764 0a1 1 0 00-.372-1.364l-1.75-1a1 1 0 10-.992 1.736l1.134.654a1 1 0 10.992-1.736l-.23-.132.23-.132zM17.25 16.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM4.75 16.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Analytics Overview', icon: '📊' },
              { id: 'ai-config', name: 'AI Configuration', icon: '🤖' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'token-limits', name: 'Token Limits', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'overview' && <AnalyticsOverview />}

          {activeTab === 'ai-config' && <AIConfiguration />}

          {activeTab === 'users' && <UsersTab />}

          {activeTab === 'token-limits' && <TokenLimitsTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;