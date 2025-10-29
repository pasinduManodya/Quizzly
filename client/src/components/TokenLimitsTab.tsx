import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface TokenLimit {
  id: string;
  subscriptionType: string;
  dailyLimit: number;
  monthlyLimit: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastModifiedBy: string;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  dailyLimit: number;
  monthlyLimit: number;
  features: string[];
  popular: boolean;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const TokenLimitsTab: React.FC = () => {
  const [limits, setLimits] = useState<TokenLimit[]>([]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLimit, setEditingLimit] = useState<TokenLimit | null>(null);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'limits' | 'pricing'>('limits');
  const [formData, setFormData] = useState({
    dailyLimit: 0,
    monthlyLimit: 0,
    description: ''
  });
  const [pricingFormData, setPricingFormData] = useState({
    name: '',
    price: 0,
    currency: '$',
    period: 'month',
    dailyLimit: 0,
    monthlyLimit: 0,
    features: [''],
    popular: false,
    color: 'teal',
    active: true
  });

  useEffect(() => {
    fetchLimits();
    fetchPricingPlans();
  }, []);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/token-limits');
      setLimits(response.data.data.limits);
    } catch (error) {
      setError('Failed to fetch token limits');
      console.error('Error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingPlans = async () => {
    try {
      const response = await axios.get('/api/admin/pricing-plans');
      setPricingPlans(response.data.data);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    }
  };

  const handleEdit = (limit: TokenLimit) => {
    setEditingLimit(limit);
    setFormData({
      dailyLimit: limit.dailyLimit,
      monthlyLimit: limit.monthlyLimit,
      description: limit.description
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingLimit) return;

    try {
      await axios.patch(`/api/admin/token-limits/${editingLimit.subscriptionType}`, formData);
      await fetchLimits();
      setShowEditModal(false);
      setEditingLimit(null);
    } catch (error) {
      console.error('Error updating limits:', error);
    }
  };

  const handleApplyToAllUsers = async () => {
    try {
      await axios.post('/api/admin/token-limits/apply-to-all-users');
      alert('Token limits applied to all users successfully!');
    } catch (error) {
      console.error('Error applying limits:', error);
      alert('Failed to apply limits to all users');
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const response = await axios.post('/api/admin/seed-token-limits');
      alert(`Default token limits seeded successfully!\nCreated: ${response.data.data.created}\nUpdated: ${response.data.data.updated}\nUsers Updated: ${response.data.data.usersUpdated}`);
      await fetchLimits();
    } catch (error) {
      console.error('Error seeding defaults:', error);
      alert('Failed to seed default token limits');
    }
  };

  const handleEditPricing = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setPricingFormData({
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      period: plan.period,
      dailyLimit: plan.dailyLimit,
      monthlyLimit: plan.monthlyLimit,
      features: plan.features,
      popular: plan.popular,
      color: plan.color,
      active: plan.active
    });
    setShowPricingModal(true);
  };

  const handleSavePricing = async () => {
    if (!editingPlan) return;

    try {
      await axios.put(`/api/admin/pricing-plans/${editingPlan.id}`, pricingFormData);
      await fetchPricingPlans();
      setShowPricingModal(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error updating pricing plan:', error);
    }
  };

  const handleInitializePricing = async () => {
    try {
      await axios.post('/api/admin/pricing-plans/initialize');
      await fetchPricingPlans();
      alert('Default pricing plans initialized successfully!');
    } catch (error) {
      console.error('Error initializing pricing plans:', error);
      alert('Failed to initialize default pricing plans');
    }
  };

  const getSubscriptionBadge = (type: string) => {
    const badges = {
      guest: 'bg-yellow-100 text-yellow-800',
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600">Loading token limits...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchLimits}
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
          <h2 className="text-2xl font-bold text-gray-900">Token Limits & Pricing Management</h2>
          <p className="text-gray-600">Configure token usage limits and pricing plans for each subscription type</p>
        </div>
        <div className="flex space-x-3">
          {activeTab === 'limits' ? (
            <>
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                🌱 Seed Defaults
              </button>
              <button
                onClick={handleApplyToAllUsers}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Apply to All Users
              </button>
              <button
                onClick={fetchLimits}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🔄 Refresh
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleInitializePricing}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                🌱 Initialize Pricing
              </button>
              <button
                onClick={fetchPricingPlans}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🔄 Refresh
              </button>
            </>
          )}
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('limits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'limits'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🎯 Token Limits
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pricing'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💰 Pricing Plans
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'limits' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Daily Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Limit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {limits.map((limit) => (
                <tr key={limit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadge(limit.subscriptionType)}`}>
                      {limit.subscriptionType.toUpperCase()}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">{formatNumber(limit.dailyLimit)}</span>
                      <span className="ml-1 text-gray-500">tokens/day</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="font-medium">{formatNumber(limit.monthlyLimit)}</span>
                      <span className="ml-1 text-gray-500">tokens/month</span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {limit.description || 'No description'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(limit.updatedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(limit)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit Limits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Pricing Plans Table */}
      {activeTab === 'pricing' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Daily Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pricingPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.popular ? 'bg-violet-100 text-violet-800' : 
                          plan.color === 'teal' ? 'bg-teal-100 text-teal-800' :
                          plan.color === 'violet' ? 'bg-violet-100 text-violet-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {plan.name}
                          {plan.popular && ' ⭐'}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="font-medium">{plan.currency}{plan.price}</span>
                        <span className="ml-1 text-gray-500">/{plan.period}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="font-medium">{formatNumber(plan.dailyLimit)}</span>
                        <span className="ml-1 text-gray-500">PDFs/day</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="font-medium">{formatNumber(plan.monthlyLimit)}</span>
                        <span className="ml-1 text-gray-500">PDFs/month</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs">
                        <div className="truncate">
                          {plan.features.slice(0, 2).join(', ')}
                          {plan.features.length > 2 && ` +${plan.features.length - 2} more`}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {plan.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditPricing(plan)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit Plan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingLimit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Token Limits - {editingLimit.subscriptionType.toUpperCase()}
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Limit (tokens)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.dailyLimit}
                      onChange={(e) => setFormData({...formData, dailyLimit: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Limit (tokens)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.monthlyLimit}
                      onChange={(e) => setFormData({...formData, monthlyLimit: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Optional description for these limits..."
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Current Limits</h4>
                  <div className="text-sm text-blue-700">
                    <p>Daily: {formatNumber(editingLimit.dailyLimit)} tokens</p>
                    <p>Monthly: {formatNumber(editingLimit.monthlyLimit)} tokens</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Edit Modal */}
      {showPricingModal && editingPlan && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Edit Pricing Plan - {editingPlan.name}
                </h3>
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={pricingFormData.name}
                      onChange={(e) => setPricingFormData({...pricingFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricingFormData.price}
                      onChange={(e) => setPricingFormData({...pricingFormData, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={pricingFormData.currency}
                      onChange={(e) => setPricingFormData({...pricingFormData, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="$">$ USD</option>
                      <option value="€">€ EUR</option>
                      <option value="£">£ GBP</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Period
                    </label>
                    <select
                      value={pricingFormData.period}
                      onChange={(e) => setPricingFormData({...pricingFormData, period: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="forever">Forever</option>
                      <option value="month">Month</option>
                      <option value="year">Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color Theme
                    </label>
                    <select
                      value={pricingFormData.color}
                      onChange={(e) => setPricingFormData({...pricingFormData, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="teal">Teal</option>
                      <option value="violet">Violet</option>
                      <option value="yellow">Yellow</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Daily Limit (PDFs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pricingFormData.dailyLimit}
                      onChange={(e) => setPricingFormData({...pricingFormData, dailyLimit: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Limit (PDFs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pricingFormData.monthlyLimit}
                      onChange={(e) => setPricingFormData({...pricingFormData, monthlyLimit: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Features (one per line)
                  </label>
                  <textarea
                    value={pricingFormData.features.join('\n')}
                    onChange={(e) => setPricingFormData({...pricingFormData, features: e.target.value.split('\n').filter(f => f.trim())})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter features, one per line..."
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pricingFormData.popular}
                      onChange={(e) => setPricingFormData({...pricingFormData, popular: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mark as Popular</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={pricingFormData.active}
                      onChange={(e) => setPricingFormData({...pricingFormData, active: e.target.checked})}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPricingModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePricing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenLimitsTab;
