import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AIProvider {
  name: string;
  models: string[];
  baseUrl: string;
  requiresApiKey: boolean;
  description: string;
  modelDescriptions?: Record<string, string>;
}

interface AIConfig {
  id?: string;
  provider: string;
  apiKey?: string;
  model: string;
  baseUrl: string;
  temperature: number;
  isActive: boolean;
  settings: any;
  lastTested?: string;
  testStatus: 'success' | 'failed' | 'not_tested';
  testError?: string;
}

const AIConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<AIConfig | null>(null);
  const [providers, setProviders] = useState<Record<string, AIProvider>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<AIConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [apiKeyValidation, setApiKeyValidation] = useState<{valid: boolean, message: string} | null>(null);
  const [modelValidation, setModelValidation] = useState<{valid: boolean, message: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access AI configurations');
        return;
      }

      // Set authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const [configsRes, providersRes] = await Promise.all([
        axios.get('/api/admin/ai-configs'),
        axios.get('/api/admin/ai-providers')
      ]);

      setConfigs(configsRes.data.data.configs);
      setProviders(providersRes.data.data.providers);
      
      // Find active config
      const activeConfig = configsRes.data.data.configs.find((c: AIConfig) => c.isActive);
      setCurrentConfig(activeConfig || null);
    } catch (error: any) {
      console.error('Error loading AI configurations:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please login as admin.');
      } else if (error.response?.status === 403) {
        setError('Admin privileges required to access AI configurations.');
      } else {
        setError(`Failed to load AI configurations: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Ensure authentication
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to save AI configurations');
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const formData = new FormData(e.target as HTMLFormElement);
      const configData: Partial<AIConfig> = {
        provider: formData.get('provider') as string,
        apiKey: formData.get('apiKey') as string,
        model: formData.get('model') as string,
        baseUrl: formData.get('baseUrl') as string,
        temperature: parseFloat(formData.get('temperature') as string),
        isActive: formData.get('isActive') === 'on',
        settings: {}
      };

      await axios.post('/api/admin/ai-config', configData);
      setSuccess(editingConfig ? 'AI configuration updated successfully!' : 'AI configuration saved successfully!');
      setShowForm(false);
      setEditingConfig(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving AI configuration:', error);
      setError(error.response?.data?.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async (configId: string) => {
    setTesting(configId);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(`/api/admin/ai-config/${configId}/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSuccess(`✅ Test successful! AI responded: "${response.data.data.response}"`);
        // Reload configurations to show updated status
        loadData();
      } else {
        setError(`❌ Test failed: ${response.data.error}`);
      }
    } catch (err: any) {
      console.error('Test error:', err);
      if (err.response?.data?.error) {
        setError(`❌ Test failed: ${err.response.data.error}`);
        if (err.response.data.details) {
          setError(prev => prev + `\n\nDetails:\n• Provider: ${err.response.data.details.provider}\n• Model: ${err.response.data.details.model}\n• API Format: ${err.response.data.details.apiKeyFormat}\n• Expected Format: ${err.response.data.details.expectedFormat || 'N/A'}`);
        }
      } else {
        setError(`❌ Test failed: ${err.message}`);
      }
    } finally {
      setTesting(null);
    }
  };

  const handleEdit = (config: AIConfig) => {
    setEditingConfig(config);
    setSelectedProvider(config.provider);
    setShowForm(true);
  };

  const validateModel = (model: string, provider: string) => {
    if (!model || model.trim() === '') {
      setModelValidation({ valid: false, message: 'Model name is required' });
      return;
    }

    const providerData = providers[provider];
    if (!providerData?.models) {
      setModelValidation({ valid: true, message: '✅ Custom model name' });
      return;
    }

    const isValidModel = providerData.models.includes(model);
    if (isValidModel) {
      setModelValidation({ valid: true, message: `✅ Valid ${providerData.name} model` });
    } else {
      setModelValidation({ 
        valid: false, 
        message: `❌ Invalid model name. Available: ${providerData.models.join(', ')}` 
      });
    }
  };

  const validateApiKey = (apiKey: string, provider: string) => {
    if (!apiKey || apiKey.trim() === '') {
      return { valid: false, message: 'API key is required' };
    }

    switch (provider) {
      case 'gemini':
        if (apiKey.startsWith('AIza')) {
          return { valid: true, message: '✅ Valid Gemini API key format' };
        } else {
          return { valid: false, message: '❌ Gemini API key should start with "AIza"' };
        }
      case 'openai':
        if (apiKey.startsWith('sk-')) {
          return { valid: true, message: '✅ Valid OpenAI API key format' };
        } else {
          return { valid: false, message: '❌ OpenAI API key should start with "sk-"' };
        }
      case 'claude':
        if (apiKey.startsWith('sk-ant-')) {
          return { valid: true, message: '✅ Valid Claude API key format' };
        } else {
          return { valid: false, message: '❌ Claude API key should start with "sk-ant-"' };
        }
      case 'custom':
        return { valid: true, message: '✅ Custom API key format accepted' };
      default:
        return { valid: false, message: '❌ Unknown provider' };
    }
  };

  const handleDelete = async (configId: string) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) {
      return;
    }

    try {
      await axios.delete(`/api/admin/ai-config/${configId}`);
      setSuccess('Configuration deleted successfully!');
      loadData();
    } catch (error: any) {
      setError('Failed to delete configuration');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  if (loading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2">Loading AI configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Configuration</h2>
          <p className="text-gray-600">Manage AI models and API settings</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          + Add Configuration
        </button>
      </div>

      {/* Study App Optimization Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Study App Optimization</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">This AI configuration is optimized for educational content:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Temperature 0.5:</strong> Focused content with good examples (Fixed)</li>
                <li><strong>Max Tokens 2000:</strong> Default for detailed explanations (Configurable)</li>
                <li><strong>Consistent Quality:</strong> Reliable responses for learning</li>
                <li><strong>Flexible Length:</strong> Adjust max tokens based on your needs</li>
              </ul>
            </div>
          </div>
        </div>
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

      {/* Current Active Configuration */}
      {currentConfig ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-green-900">Active Configuration</h3>
              <div className="mt-2 space-y-1">
                <p className="text-green-700 font-medium">
                  {providers[currentConfig.provider]?.name || currentConfig.provider} - {currentConfig.model}
                </p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">API Endpoint:</span> {currentConfig.baseUrl || providers[currentConfig.provider]?.baseUrl || 'Default'}
                </p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">Temperature:</span> {currentConfig.temperature}
                </p>
                <p className="text-sm text-green-600">
                  <span className="font-medium">Last tested:</span> {currentConfig.lastTested ? new Date(currentConfig.lastTested).toLocaleString() : 'Never'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentConfig.testStatus)}`}>
                {getStatusIcon(currentConfig.testStatus)} {currentConfig.testStatus.toUpperCase()}
              </span>
              <button
                onClick={() => handleTest(currentConfig.id!)}
                disabled={testing === currentConfig.id}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {testing === currentConfig.id ? 'Testing...' : 'Test Now'}
              </button>
            </div>
          </div>
          {currentConfig.testError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                <span className="font-medium">Last Error:</span> {currentConfig.testError}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">No Active Configuration</h3>
              <div className="mt-2 space-y-1">
                <p className="text-yellow-700 font-medium">
                  Google Gemini - gemini-2.5-flash (Fallback)
                </p>
                <p className="text-sm text-yellow-600">
                  <span className="font-medium">API Endpoint:</span> https://generativelanguage.googleapis.com/v1beta
                </p>
                <p className="text-sm text-yellow-600">
                  <span className="font-medium">Max Tokens:</span> 2000 | 
                  <span className="font-medium"> Temperature:</span> 0.5 (Study Optimized)
                </p>
                <p className="text-sm text-yellow-600">
                  <span className="font-medium">Status:</span> Using hardcoded fallback settings
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                ⚠️ FALLBACK
              </span>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Note:</span> No AI configuration found in database. The system is using hardcoded Gemini settings. 
              Click "Add Configuration" to set up your preferred AI provider.
            </p>
          </div>
        </div>
      )}

      {/* Configurations List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Configurations</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your AI model configurations</p>
        </div>
        <ul className="divide-y divide-gray-200">
          {configs.map((config) => (
            <li key={config.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      config.isActive ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <span className={`text-sm font-medium ${
                        config.isActive ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {config.provider.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {providers[config.provider]?.name || config.provider} - {config.model}
                      {config.isActive && <span className="ml-2 text-green-600 font-semibold">(Active)</span>}
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Endpoint:</span> {config.baseUrl || providers[config.provider]?.baseUrl || 'Default'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Temperature: {config.temperature}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last tested: {config.lastTested ? new Date(config.lastTested).toLocaleString() : 'Never'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(config.testStatus)}`}>
                    {getStatusIcon(config.testStatus)} {config.testStatus}
                  </span>
                  <button
                    onClick={() => handleEdit(config)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTest(config.id!)}
                    disabled={testing === config.id}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {testing === config.id ? 'Testing...' : 'Test'}
                  </button>
                  <button
                    onClick={() => handleDelete(config.id!)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {config.testError && (
                <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                  Error: {config.testError}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Add Configuration Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConfig ? 'Edit AI Configuration' : 'Add AI Configuration'}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingConfig(null);
                  setSelectedProvider('');
                  setApiKeyValidation(null);
                  setModelValidation(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    name="provider"
                    required
                    defaultValue={editingConfig?.provider || ''}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select Provider</option>
                    {Object.entries(providers).map(([key, provider]) => (
                      <option key={key} value={key}>{provider.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    name="model"
                    required
                    defaultValue={editingConfig?.model || ''}
                    onChange={(e) => {
                      const provider = selectedProvider || editingConfig?.provider || '';
                      const model = e.target.value;
                      if (provider && model) {
                        validateModel(model, provider);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="e.g., gemini-2.5-flash, gpt-4, claude-3-5-sonnet"
                  />
                  {modelValidation && (
                    <div className={`mt-1 text-xs ${modelValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                      {modelValidation.message}
                    </div>
                  )}
                  {(selectedProvider || editingConfig?.provider) && providers[selectedProvider || editingConfig?.provider!]?.modelDescriptions && (
                    <div className="mt-1 text-xs text-gray-500">
                      <span className="font-medium">Available models:</span>
                      <ul className="mt-1 space-y-1">
                        {Object.entries(providers[selectedProvider || editingConfig?.provider!].modelDescriptions!).map(([model, desc]) => (
                          <li key={model} className="flex justify-between">
                            <span className="font-mono">{model}</span>
                            <span className="text-gray-400">{desc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  name="apiKey"
                  required
                  placeholder={editingConfig ? "Enter new API key (leave blank to keep current)" : "Enter your API key"}
                  onChange={(e) => {
                    const provider = selectedProvider || editingConfig?.provider || '';
                    if (provider) {
                      setApiKeyValidation(validateApiKey(e.target.value, provider));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    apiKeyValidation ? (apiKeyValidation.valid ? 'border-green-300 focus:ring-green-500' : 'border-red-300 focus:ring-red-500') : 'border-gray-300 focus:ring-red-500'
                  }`}
                />
                {apiKeyValidation && (
                  <div className={`mt-1 text-xs ${apiKeyValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {apiKeyValidation.message}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">
                  <span className="font-medium">Expected formats:</span>
                  <ul className="mt-1 space-y-1">
                    <li>• Gemini: AIza...</li>
                    <li>• OpenAI: sk-...</li>
                    <li>• Claude: sk-ant-...</li>
                    <li>• Custom: Any format</li>
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="url"
                  name="baseUrl"
                  defaultValue={editingConfig?.baseUrl || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Leave empty for default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600">
                  <span className="font-medium">0.5</span> (Fixed for Study App - Focused with good examples)
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Temperature is optimized for educational content and cannot be changed
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={editingConfig?.isActive || false}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Set as active configuration
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingConfig(null);
                    setSelectedProvider('');
                    setApiKeyValidation(null);
                    setModelValidation(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingConfig ? 'Update Configuration' : 'Save Configuration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfiguration;
