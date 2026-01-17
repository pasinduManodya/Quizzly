import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TokenUsage {
  totalUsed: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  dailyUsed: number;
  dailyInputTokens: number;
  dailyOutputTokens: number;
  monthlyUsed: number;
  monthlyInputTokens: number;
  monthlyOutputTokens: number;
  dailyRemaining: number;
  monthlyRemaining: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyPercentage: number;
  monthlyPercentage: number;
}

interface User {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: string;
  role: string;
  isGuest: boolean;
  isPro: boolean;
  subscriptionType: string;
  subscriptionStatus: string;
  subscriptionExpiry: string | null;
  subscriptionStartDate: string | null;
  paymentMethod: string | null;
  maxDocuments: number;
  documentsCount: number;
  totalQuizzesTaken: number;
  totalDocumentsUploaded: number;
  tokenUsage: TokenUsage;
  createdAt: string;
  lastActivity: string;
  lastLoginDate: string;
  timezone: string;
}

const UsersTab: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  useEffect(() => {
    fetchUsers(true);
    
    // Set up auto-refresh interval for real-time token usage updates
    const refreshInterval = setInterval(() => {
      if (autoRefreshEnabled) {
        fetchUsers(false);
      }
    }, 2000); // Refresh every 2 seconds for real-time updates
    
    return () => clearInterval(refreshInterval);
  }, [autoRefreshEnabled, selectedUser, showUserModal]);

  const fetchUsers = async (showLoading: boolean = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.data.users);
      
      // Update selected user if modal is open
      if (selectedUser && showUserModal) {
        const updatedUser = response.data.data.users.find((u: User) => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleUpdateSubscription = async (userId: string, subscriptionData: any) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/subscription`, subscriptionData);
      await fetchUsers();
      setEditingSubscription(false);
      alert('Subscription updated successfully!');
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      alert(error.response?.data?.message || 'Failed to update subscription');
    }
  };

  const handleChangePlan = async (userId: string, newPlan: 'free' | 'pro' | 'premium') => {
    if (!window.confirm(`Change user plan to ${newPlan.toUpperCase()}?\n\nThis will update their subscription and token limits immediately.`)) {
      return;
    }

    try {
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      const subscriptionData = {
        subscriptionType: newPlan,
        isPro: newPlan === 'pro' || newPlan === 'premium',
        subscriptionStartDate: now.toISOString(),
        subscriptionExpiry: newPlan === 'free' ? null : oneYearLater.toISOString(), // No expiry for free, 1 year for paid plans
        paymentMethod: newPlan === 'free' ? null : 'Admin Assignment' // Set payment method for tracking
      };
      await handleUpdateSubscription(userId, subscriptionData);
    } catch (error) {
      console.error('Error changing plan:', error);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userEmail}"?\n\nThis will delete:\n- User account\n- All their documents\n- All their quiz results\n- All their favorites\n\nThis action CANNOT be undone!`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/users/${userId}`);
      alert('User deleted successfully!');
      await fetchUsers();
      if (selectedUser?.id === userId) {
        setShowUserModal(false);
        setSelectedUser(null);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { role });
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleResetTokens = async (userId: string, resetType: string) => {
    try {
      await axios.post(`/api/admin/users/${userId}/reset-tokens`, { resetType });
      await fetchUsers();
      setShowUserModal(false);
    } catch (error) {
      console.error('Error resetting tokens:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesSubscription = filterSubscription === 'all' || user.subscriptionStatus === filterSubscription;
    
    return matchesSearch && matchesRole && matchesSubscription;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortBy as keyof User];
    let bValue = b[sortBy as keyof User];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';
    
    if (sortBy === 'createdAt' || sortBy === 'lastActivity' || sortBy === 'lastLoginDate') {
      aValue = new Date(aValue as string).getTime();
      bValue = new Date(bValue as string).getTime();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getSubscriptionBadge = (status: string) => {
    const badges = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800',
      guest: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => fetchUsers(true)}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user accounts, subscriptions, and permissions</p>
        </div>
        <div className="text-sm text-gray-500">
          Total Users: {users.length} | Showing: {filteredUsers.length}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription</label>
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Subscriptions</option>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
              <option value="guest">Guest</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="createdAt">Join Date</option>
              <option value="lastActivity">Last Activity</option>
              <option value="lastLoginDate">Last Login</option>
              <option value="email">Email</option>
              <option value="subscriptionStatus">Subscription</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
          <button
            onClick={() => fetchUsers(true)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`px-3 py-1 text-sm rounded font-medium ${
              autoRefreshEnabled
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {autoRefreshEnabled ? '⏱️ Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-red-600">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        {user.country && (
                          <div className="text-xs text-gray-400">
                            🌍 {user.country}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                    {user.isGuest && (
                      <span className="ml-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Guest
                      </span>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadge(user.subscriptionStatus)}`}>
                        {user.subscriptionStatus}
                      </span>
                      {user.subscriptionExpiry && (
                        <div className="text-xs text-gray-500">
                          Expires: {formatDate(user.subscriptionExpiry)}
                        </div>
                      )}
                      {user.paymentMethod && (
                        <div className="text-xs text-gray-500">
                          💳 {user.paymentMethod}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="space-y-1">
                      <div>📄 {user.documentsCount}/{user.maxDocuments} docs</div>
                      <div>📝 {user.totalQuizzesTaken} quizzes</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-900">
                    <div className="space-y-2">
                      <div>
                        <div className="font-semibold text-gray-700 mb-1">Daily:</div>
                        <div className="ml-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Input:</span>
                            <span className="text-gray-700 font-medium">{user.tokenUsage.dailyInputTokens?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Output:</span>
                            <span className="text-gray-700 font-medium">{user.tokenUsage.dailyOutputTokens?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="text-gray-600 font-semibold">Total:</span>
                            <span className="text-gray-800 font-bold">{user.tokenUsage.dailyUsed?.toLocaleString() || 0}/{user.tokenUsage.dailyLimit?.toLocaleString() || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                user.tokenUsage.dailyPercentage > 90 ? 'bg-red-500' :
                                user.tokenUsage.dailyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(user.tokenUsage.dailyPercentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="font-semibold text-gray-700 mb-1">Monthly:</div>
                        <div className="ml-2 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Input:</span>
                            <span className="text-gray-700 font-medium">{user.tokenUsage.monthlyInputTokens?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Output:</span>
                            <span className="text-gray-700 font-medium">{user.tokenUsage.monthlyOutputTokens?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between border-t pt-1">
                            <span className="text-gray-600 font-semibold">Total:</span>
                            <span className="text-gray-800 font-bold">{user.tokenUsage.monthlyUsed?.toLocaleString() || 0}/{user.tokenUsage.monthlyLimit?.toLocaleString() || 0}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                user.tokenUsage.monthlyPercentage > 90 ? 'bg-red-500' :
                                user.tokenUsage.monthlyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(user.tokenUsage.monthlyPercentage || 0, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-1">
                        <span className="text-gray-600">Total All Time:</span>
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600">Input:</span>
                          <span className="text-gray-700 font-medium">{user.tokenUsage.totalInputTokens?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Output:</span>
                          <span className="text-gray-700 font-medium">{user.tokenUsage.totalOutputTokens?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1">
                          <span className="text-gray-600 font-semibold">Total:</span>
                          <span className="text-gray-800 font-bold">{user.tokenUsage.totalUsed?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div>Last Activity: {formatDate(user.lastActivity)}</div>
                      <div>Last Login: {formatDate(user.lastLoginDate)}</div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleUpdateRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                          className="text-green-600 hover:text-green-900"
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleChangePlan(user.id, 'free')}
                          className={`text-xs px-2 py-1 rounded ${
                            user.subscriptionStatus === 'free' 
                              ? 'bg-gray-200 text-gray-700 cursor-not-allowed' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          disabled={user.subscriptionStatus === 'free'}
                          title="Change to Free"
                        >
                          Free
                        </button>
                        <button
                          onClick={() => handleChangePlan(user.id, 'pro')}
                          className={`text-xs px-2 py-1 rounded ${
                            user.subscriptionStatus === 'pro' 
                              ? 'bg-blue-200 text-blue-700 cursor-not-allowed' 
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                          disabled={user.subscriptionStatus === 'pro'}
                          title="Change to Pro"
                        >
                          Pro
                        </button>
                        <button
                          onClick={() => handleChangePlan(user.id, 'premium')}
                          className={`text-xs px-2 py-1 rounded ${
                            user.subscriptionStatus === 'premium' 
                              ? 'bg-purple-200 text-purple-700 cursor-not-allowed' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          }`}
                          disabled={user.subscriptionStatus === 'premium'}
                          title="Change to Premium"
                        >
                          Premium
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-600 hover:text-red-900 text-xs"
                        title="Delete User"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">User Details</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-sm text-gray-900">{selectedUser.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <p className="text-sm text-gray-900">{selectedUser.country || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subscription</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadge(selectedUser.subscriptionStatus)}`}>
                      {selectedUser.subscriptionStatus}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Subscription Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-gray-900">{selectedUser.subscriptionType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <p className="text-gray-900">
                        {selectedUser.subscriptionStartDate ? formatDate(selectedUser.subscriptionStartDate) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <p className="text-gray-900">
                        {selectedUser.subscriptionExpiry ? formatDate(selectedUser.subscriptionExpiry) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <p className="text-gray-900">{selectedUser.paymentMethod || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Usage Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Documents</label>
                      <p className="text-gray-900">{selectedUser.documentsCount}/{selectedUser.maxDocuments}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quizzes Taken</label>
                      <p className="text-gray-900">{selectedUser.totalQuizzesTaken}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Join Date</label>
                      <p className="text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Login</label>
                      <p className="text-gray-900">{formatDate(selectedUser.lastLoginDate)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Token Usage</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Daily Usage</span>
                        <span className="text-gray-600">
                          {selectedUser.tokenUsage.dailyUsed.toLocaleString()}/{selectedUser.tokenUsage.dailyLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedUser.tokenUsage.dailyPercentage > 90 ? 'bg-red-500' :
                            selectedUser.tokenUsage.dailyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(selectedUser.tokenUsage.dailyPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedUser.tokenUsage.dailyRemaining.toLocaleString()} tokens remaining
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Monthly Usage</span>
                        <span className="text-gray-600">
                          {selectedUser.tokenUsage.monthlyUsed.toLocaleString()}/{selectedUser.tokenUsage.monthlyLimit.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            selectedUser.tokenUsage.monthlyPercentage > 90 ? 'bg-red-500' :
                            selectedUser.tokenUsage.monthlyPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(selectedUser.tokenUsage.monthlyPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {selectedUser.tokenUsage.monthlyRemaining.toLocaleString()} tokens remaining
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <label className="block text-sm font-medium text-gray-700">Total Tokens Used</label>
                      <p className="text-gray-900">{selectedUser.tokenUsage.totalUsed.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-between">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleChangePlan(selectedUser.id, 'free')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedUser.subscriptionStatus === 'free'
                        ? 'bg-gray-200 text-gray-700 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={selectedUser.subscriptionStatus === 'free'}
                  >
                    Set to Free
                  </button>
                  <button
                    onClick={() => handleChangePlan(selectedUser.id, 'pro')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedUser.subscriptionStatus === 'pro'
                        ? 'bg-blue-200 text-blue-700 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    disabled={selectedUser.subscriptionStatus === 'pro'}
                  >
                    Set to Pro
                  </button>
                  <button
                    onClick={() => handleChangePlan(selectedUser.id, 'premium')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedUser.subscriptionStatus === 'premium'
                        ? 'bg-purple-200 text-purple-700 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                    disabled={selectedUser.subscriptionStatus === 'premium'}
                  >
                    Set to Premium
                  </button>
                  <button
                    onClick={() => {
                      setEditingSubscription(true);
                      setShowUserModal(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Edit Details
                  </button>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => handleDeleteUser(selectedUser.id, selectedUser.email)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    🗑️ Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingSubscription && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Subscription</h3>
                <button
                  onClick={() => setEditingSubscription(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const subscriptionData = {
                  isPro: formData.get('isPro') === 'true',
                  subscriptionType: formData.get('subscriptionType'),
                  subscriptionExpiry: formData.get('subscriptionExpiry'),
                  subscriptionStartDate: formData.get('subscriptionStartDate'),
                  paymentMethod: formData.get('paymentMethod')
                };
                handleUpdateSubscription(selectedUser.id, subscriptionData);
              }}>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pro User</label>
                      <select
                        name="isPro"
                        defaultValue={selectedUser.isPro.toString()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="false">Free</option>
                        <option value="true">Pro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subscription Type</label>
                      <select
                        name="subscriptionType"
                        defaultValue={selectedUser.subscriptionType}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Date</label>
                      <input
                        type="datetime-local"
                        name="subscriptionStartDate"
                        defaultValue={selectedUser.subscriptionStartDate ? new Date(selectedUser.subscriptionStartDate).toISOString().slice(0, 16) : ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                      <input
                        type="datetime-local"
                        name="subscriptionExpiry"
                        defaultValue={selectedUser.subscriptionExpiry ? new Date(selectedUser.subscriptionExpiry).toISOString().slice(0, 16) : ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <input
                        type="text"
                        name="paymentMethod"
                        defaultValue={selectedUser.paymentMethod || ''}
                        placeholder="e.g., Credit Card, PayPal, etc."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingSubscription(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Update Subscription
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTab;
