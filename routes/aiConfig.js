const express = require('express');
const adminAuth = require('../middleware/adminAuth');
const AIConfig = require('../models/AIConfig');
const { 
  ValidationError, 
  asyncHandler,
  logger 
} = require('../middleware/errorHandler');

const router = express.Router();

// Get current AI configuration
router.get('/ai-config', adminAuth, asyncHandler(async (req, res) => {
  const config = await AIConfig.findOne({ isActive: true });
  
  if (!config) {
    return res.json({
      success: true,
      data: {
        config: null
      }
    });
  }

  // Don't send the full API key for security
  const safeConfig = {
    id: config._id,
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    temperature: config.temperature,
    isActive: config.isActive,
    settings: config.settings,
    lastTested: config.lastTested,
    testStatus: config.testStatus,
    testError: config.testError,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  };

  res.json({
    success: true,
    data: {
      config: safeConfig
    }
  });
}));

// Get all AI configurations
router.get('/ai-configs', adminAuth, asyncHandler(async (req, res) => {
  const configs = await AIConfig.find({}).sort({ createdAt: -1 });
  
  const safeConfigs = configs.map(config => ({
    id: config._id,
    provider: config.provider,
    model: config.model,
    baseUrl: config.baseUrl,
    temperature: config.temperature,
    isActive: config.isActive,
    settings: config.settings,
    lastTested: config.lastTested,
    testStatus: config.testStatus,
    testError: config.testError,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt
  }));

  res.json({
    success: true,
    data: {
      configs: safeConfigs
    }
  });
}));

// Create or update AI configuration
router.post('/ai-config', adminAuth, asyncHandler(async (req, res) => {
  const { provider, apiKey, model, baseUrl, settings, isActive } = req.body;

  // Validate required fields
  if (!provider || !apiKey || !model) {
    throw new ValidationError('Provider, API key, and model are required');
  }

  // If setting as active, deactivate others
  if (isActive) {
    await AIConfig.updateMany({}, { isActive: false });
  }

  // Check if config already exists
  let config = await AIConfig.findOne({ provider, model });
  
  if (config) {
    // Update existing
    config.apiKey = apiKey;
    config.baseUrl = baseUrl || '';
    config.temperature = 0.5; // Fixed for study apps
    config.settings = settings || {};
    config.isActive = isActive || false;
    config.testStatus = 'not_tested';
    config.testError = null;
    await config.save();
  } else {
    // Create new
    config = new AIConfig({
      provider,
      apiKey,
      model,
      baseUrl: baseUrl || '',
      temperature: 0.5, // Fixed for study apps - always use optimal value
      settings: settings || {},
      isActive: isActive || false
    });
    await config.save();
  }

  logger.info(`Admin ${req.user.email} ${config.isNew ? 'created' : 'updated'} AI config`, {
    adminId: req.user._id,
    provider: config.provider,
    model: config.model,
    isActive: config.isActive
  });

  res.json({
    success: true,
    message: `AI configuration ${config.isNew ? 'created' : 'updated'} successfully`,
    data: {
      config: {
        id: config._id,
        provider: config.provider,
        model: config.model,
        baseUrl: config.baseUrl,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        isActive: config.isActive,
        settings: config.settings,
        testStatus: config.testStatus
      }
    }
  });
}));

// Test AI configuration with enhanced validation
router.post('/ai-config/:id/test', adminAuth, asyncHandler(async (req, res) => {
  const config = await AIConfig.findById(req.params.id).select('+apiKey'); // Include API key for testing
  
  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'AI configuration not found'
    });
  }

  try {
    console.log(`🧪 Testing AI configuration: ${config.provider} - ${config.model}`);
    
    // Step 1: Validate API key format
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required');
    }

    // Provider-specific API key validation
    let apiKeyValid = false;
    let apiKeyError = '';
    
    switch (config.provider) {
      case 'gemini':
        if (config.apiKey.startsWith('AIza')) {
          apiKeyValid = true;
        } else {
          apiKeyError = 'Gemini API key should start with "AIza"';
        }
        break;
      case 'openai':
        if (config.apiKey.startsWith('sk-')) {
          apiKeyValid = true;
        } else {
          apiKeyError = 'OpenAI API key should start with "sk-"';
        }
        break;
      case 'claude':
        if (config.apiKey.startsWith('sk-ant-')) {
          apiKeyValid = true;
        } else {
          apiKeyError = 'Claude API key should start with "sk-ant-"';
        }
        break;
      case 'custom':
        apiKeyValid = true; // Custom APIs can have any format
        break;
      default:
        apiKeyError = 'Unknown provider';
    }

    if (!apiKeyValid) {
      config.lastTested = new Date();
      config.testStatus = 'failed';
      config.testError = apiKeyError;
      await config.save();
      return res.status(400).json({ 
        success: false, 
        message: 'API key validation failed', 
        error: apiKeyError,
        details: {
          apiKeyFormat: 'Invalid',
          provider: config.provider,
          model: config.model,
          expectedFormat: getExpectedApiKeyFormat(config.provider)
        }
      });
    }

    // Step 2: Test the actual AI service connection
    const { testAIConfiguration } = require('../services/aiService');
    const testResult = await testAIConfiguration(config);

    // Step 3: Update configuration with success and make it active
    config.lastTested = new Date();
    config.testStatus = 'success';
    config.testError = null;
    config.isActive = true; // Make it active when test succeeds
    await config.save();

    res.json({
      success: true,
      message: 'AI configuration test successful!',
      data: {
        response: testResult.response,
        details: {
          provider: config.provider,
          model: config.model,
          apiKeyFormat: 'Valid',
          endpoint: config.baseUrl || 'Default',
          temperature: config.temperature,
          testTime: testResult.timestamp
        }
      }
    });

  } catch (error) {
    console.error(`❌ AI configuration test failed:`, error.message);
    
    // Update config with test failure
    config.lastTested = new Date();
    config.testStatus = 'failed';
    config.testError = error.message;
    await config.save();
    
    res.status(400).json({
      success: false,
      message: 'AI configuration test failed',
      error: error.message,
      details: {
        provider: config.provider,
        model: config.model,
        apiKeyFormat: 'Unknown',
        endpoint: config.baseUrl || 'Default',
        testTime: new Date().toISOString()
      }
    });
  }
}));

// Helper function to get expected API key format
function getExpectedApiKeyFormat(provider) {
  switch (provider) {
    case 'gemini': return 'Should start with "AIza"';
    case 'openai': return 'Should start with "sk-"';
    case 'claude': return 'Should start with "sk-ant-"';
    case 'custom': return 'Any format accepted';
    default: return 'Unknown format';
  }
}

// Delete AI configuration
router.delete('/ai-config/:id', adminAuth, asyncHandler(async (req, res) => {
  const config = await AIConfig.findById(req.params.id);
  
  if (!config) {
    return res.status(404).json({
      success: false,
      message: 'AI configuration not found'
    });
  }

  await AIConfig.findByIdAndDelete(req.params.id);

  logger.info(`Admin ${req.user.email} deleted AI config`, {
    adminId: req.user._id,
    provider: config.provider,
    model: config.model
  });

  res.json({
    success: true,
    message: 'AI configuration deleted successfully'
  });
}));

// Get available AI providers and their models
router.get('/ai-providers', adminAuth, asyncHandler(async (req, res) => {
  const providers = {
    gemini: {
      name: 'Google Gemini',
      models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-2.5-flash'],
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      requiresApiKey: true,
      description: 'Google\'s advanced AI model',
      modelDescriptions: {
        'gemini-pro': 'Gemini Pro - General purpose model',
        'gemini-pro-vision': 'Gemini Pro Vision - Multimodal model',
        'gemini-1.5-pro': 'Gemini 1.5 Pro - Latest advanced model',
        'gemini-1.5-flash': 'Gemini 1.5 Flash - Fast and efficient',
        'gemini-2.5-flash': 'Gemini 2.5 Flash - Latest fast model'
      }
    },
    openai: {
      name: 'OpenAI',
      models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
      baseUrl: 'https://api.openai.com/v1',
      requiresApiKey: true,
      description: 'OpenAI\'s ChatGPT models',
      modelDescriptions: {
        'gpt-3.5-turbo': 'GPT-3.5 Turbo - Fast and cost-effective',
        'gpt-4': 'GPT-4 - Most capable model',
        'gpt-4-turbo': 'GPT-4 Turbo - Enhanced GPT-4',
        'gpt-4o': 'GPT-4o - Optimized multimodal model',
        'gpt-4o-mini': 'GPT-4o Mini - Smaller, faster GPT-4o'
      }
    },
    claude: {
      name: 'Anthropic Claude',
      models: ['claude-3-sonnet', 'claude-3-opus', 'claude-3-haiku', 'claude-3-5-sonnet'],
      baseUrl: 'https://api.anthropic.com/v1',
      requiresApiKey: true,
      description: 'Anthropic\'s Claude AI model',
      modelDescriptions: {
        'claude-3-sonnet': 'Claude 3 Sonnet - Balanced performance',
        'claude-3-opus': 'Claude 3 Opus - Most capable',
        'claude-3-haiku': 'Claude 3 Haiku - Fast and efficient',
        'claude-3-5-sonnet': 'Claude 3.5 Sonnet - Latest model'
      }
    },
    custom: {
      name: 'Custom API',
      models: ['custom'],
      baseUrl: '',
      requiresApiKey: true,
      description: 'Custom AI API endpoint',
      modelDescriptions: {
        'custom': 'Custom model - Specify your own model name'
      }
    }
  };

  res.json({
    success: true,
    data: {
      providers
    }
  });
}));

module.exports = router;
