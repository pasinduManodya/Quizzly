import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface APIConfig {
  id: string;
  provider: string;
  model: string;
  priority: number;
  isActive: boolean;
  creditsExhausted: boolean;
  creditsExhaustedAt?: string;
  testStatus: string;
  failureCount: number;
  successCount: number;
  lastSuccessAt?: string;
  lastFailureAt?: string;
}

interface RotationStatus {
  totalConfigs: number;
  activeConfig: any;
  availableConfigs: number;
  exhaustedConfigs: number;
  exhaustedList: any[];
}

const APIRotationManager: React.FC = () => {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [rotationStatus, setRotationStatus] = useState<RotationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPriority, setEditingPriority] = useState<string | null>(null);
  const [priorityValues, setPriorityValues] = useState<Record<string, number>>({});

  useEffect(() => {
    loadRotationData();
  }, []);

  const loadRotationData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access API rotation settings');
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await axios.get('/api/admin/ai-rotation-status');
      const allConfigs = response.data.data.allConfigs;
      setConfigs(allConfigs);
      setRotationStatus(response.data.data.rotationStatus);

      // Initialize priority values
      const priorities: Record<string, number> = {};
      allConfigs.forEach((config: APIConfig) => {
        priorities[config.id] = config.priority;
      });
      setPriorityValues(priorities);
    } catch (error: any) {
      console.error('Error loading rotation data:', error);
      setError(error.response?.data?.message || 'Failed to load rotation status');
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityChange = async (configId: string, newPriority: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await axios.put(
        `/api/admin/ai-config/${configId}/priority`,
        { priority: newPriority },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Priority updated successfully!');
      setEditingPriority(null);
      loadRotationData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update priority');
    }
  };

  const handleMarkExhausted = async (configId: string) => {
    if (!window.confirm('Mark this API as exhausted? The system will switch to the next available API.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await axios.post(
        `/api/admin/ai-config/${configId}/mark-exhausted`,
        { reason: 'Manually marked as exhausted by admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('API marked as exhausted. System will use next available API.');
      loadRotationData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to mark as exhausted');
    }
  };

  const handleRestore = async (configId: string) => {
    if (!window.confirm('Restore this API? Credits counter will be reset.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      await axios.post(
        `/api/admin/ai-config/${configId}/restore`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('API restored successfully!');
      loadRotationData();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to restore API');
    }
  };

  const getStatusBadgeColor = (status: string, exhausted: boolean) => {
    if (exhausted) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, exhausted: boolean) => {
    if (exhausted) return '🚫';
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '⚠️';
      default: return '⏳';
    }
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">Loading API rotation settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">API Rotation Manager</h2>
        <p className="text-gray-600">Manage API key priorities and automatic fallback</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Rotation Status Overview */}
      {rotationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total APIs</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{rotationStatus.totalConfigs}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Available</div>
            <div className="mt-2 text-3xl font-bold text-green-600">{rotationStatus.availableConfigs}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Exhausted</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{rotationStatus.exhaustedConfigs}</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Currently Active</div>
            <div className="mt-2 text-lg font-bold text-blue-600">
              {rotationStatus.activeConfig ? (
                <span>{rotationStatus.activeConfig.provider} - {rotationStatus.activeConfig.model}</span>
              ) : (
                <span className="text-red-600">None</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How API Rotation Works</h3>
            <div className="mt-2 text-sm text-blue-700 space-y-1">
              <p>• <strong>Priority System:</strong> Lower priority number = higher priority (0 is highest)</p>
              <p>• <strong>Automatic Fallback:</strong> When an API hits quota, system automatically switches to next available</p>
              <p>• <strong>Error Detection:</strong> Detects quota/rate limit errors and marks API as exhausted</p>
              <p>• <strong>Manual Control:</strong> Mark APIs as exhausted or restore them as needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* API Configurations Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">API Configurations</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage rotation priorities and status</p>
        </div>

        {configs.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No API configurations found. Add one in the AI Configuration tab.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id} className={config.creditsExhausted ? 'bg-red-50' : config.isActive ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{config.provider}</div>
                      <div className="text-sm text-gray-500">{config.model}</div>
                      {config.isActive && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingPriority === config.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            value={priorityValues[config.id]}
                            onChange={(e) => setPriorityValues({
                              ...priorityValues,
                              [config.id]: parseInt(e.target.value)
                            })}
                            className="w-16 px-2 py-1 border border-gray-300 rounded"
                          />
                          <button
                            onClick={() => handlePriorityChange(config.id, priorityValues[config.id])}
                            className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingPriority(null)}
                            className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingPriority(config.id)}
                          className="cursor-pointer text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {config.priority} <span className="text-xs text-gray-400">(click to edit)</span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(config.testStatus, config.creditsExhausted)}`}>
                        {getStatusIcon(config.testStatus, config.creditsExhausted)} {config.creditsExhausted ? 'EXHAUSTED' : config.testStatus.toUpperCase()}
                      </span>
                      {config.creditsExhaustedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Exhausted: {new Date(config.creditsExhaustedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-y-1">
                        <div>✅ Success: <span className="font-semibold">{config.successCount}</span></div>
                        <div>❌ Failures: <span className="font-semibold">{config.failureCount}</span></div>
                        {config.lastSuccessAt && (
                          <div className="text-xs text-gray-500">
                            Last: {new Date(config.lastSuccessAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {config.creditsExhausted ? (
                        <button
                          onClick={() => handleRestore(config.id)}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkExhausted(config.id)}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Mark Exhausted
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exhausted APIs List */}
      {rotationStatus && rotationStatus.exhaustedList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-4">Exhausted APIs</h3>
          <div className="space-y-2">
            {rotationStatus.exhaustedList.map((config) => (
              <div key={config.id} className="flex items-center justify-between bg-white p-3 rounded border border-red-200">
                <div>
                  <p className="font-medium text-gray-900">{config.provider} - {config.model}</p>
                  <p className="text-sm text-gray-500">
                    Exhausted: {new Date(config.exhaustedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRestore(config.id)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default APIRotationManager;
