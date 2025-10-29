const axios = require('axios');

class AIService {
  constructor(config) {
    this.config = config;
  }

  async generateQuiz(documentText, options = {}) {
    const prompt = this.buildQuizPrompt(documentText, options);
    const result = await this.callAI(prompt);
    return result.response; // Return just the response for backward compatibility
  }

  async generateExplanation(question, answer, context) {
    const prompt = this.buildExplanationPrompt(question, answer, context);
    const result = await this.callAI(prompt);
    return result.response; // Return just the response for backward compatibility
  }

  // New method that returns both response and token usage
  async generateQuizWithTokens(documentText, options = {}) {
    const prompt = this.buildQuizPrompt(documentText, options);
    return await this.callAI(prompt);
  }

  async generateExplanationWithTokens(question, answer, context) {
    const prompt = this.buildExplanationPrompt(question, answer, context);
    return await this.callAI(prompt);
  }

  async callAI(prompt) {
    try {
      console.log(`🤖 Calling AI service: ${this.config.provider} - ${this.config.model}`);
      console.log(`📝 Prompt length: ${prompt.length} characters`);
      
      let result;
      let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      
      switch (this.config.provider) {
        case 'gemini':
          result = await this.callGemini(prompt);
          tokenUsage = this.estimateGeminiTokens(prompt, result);
          break;
        case 'openai':
          result = await this.callOpenAI(prompt);
          tokenUsage = this.estimateOpenAITokens(prompt, result);
          break;
        case 'claude':
          result = await this.callClaude(prompt);
          tokenUsage = this.estimateClaudeTokens(prompt, result);
          break;
        case 'custom':
          result = await this.callCustom(prompt);
          tokenUsage = this.estimateCustomTokens(prompt, result);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.config.provider}`);
      }
      
      console.log(`📊 Token usage: ${tokenUsage.totalTokens} tokens (${tokenUsage.promptTokens} prompt + ${tokenUsage.completionTokens} completion)`);
      
      return {
        response: result,
        tokenUsage: tokenUsage
      };
    } catch (error) {
      console.error(`❌ AI service call failed for ${this.config.provider}:`, error.message);
      console.error(`❌ Error details:`, error);
      throw error;
    }
  }

  async callGemini(prompt) {
    const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    const url = `${baseUrl}/models/${this.config.model}:generateContent`;
    
    console.log('🔗 Gemini API URL:', url);
    console.log('🔑 API Key:', this.config.apiKey ? this.config.apiKey.substring(0, 10) + '...' : 'Missing');
    
    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: this.config.temperature,
        ...this.config.settings
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.config.apiKey
      }
    });

    console.log('🔍 Gemini API Response Status:', response.status);
    console.log('🔍 Gemini API Response Data:', JSON.stringify(response.data, null, 2));

    // Check if response has the expected structure
    if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
      console.error('❌ Invalid Gemini API response structure:', response.data);
      throw new Error('Invalid response structure from Gemini API');
    }

    const candidate = response.data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      console.error('❌ Invalid candidate structure:', candidate);
      throw new Error('Invalid candidate structure from Gemini API');
    }

    return candidate.content.parts[0].text;
  }

  async callOpenAI(prompt) {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const url = `${baseUrl}/chat/completions`;
    
    console.log('🔗 OpenAI API URL:', url);
    console.log('🔑 API Key:', this.config.apiKey ? this.config.apiKey.substring(0, 10) + '...' : 'Missing');
    
    const response = await axios.post(url, {
      model: this.config.model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: this.config.temperature,
      ...this.config.settings
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      }
    });

    return response.data.choices[0].message.content;
  }

  async callClaude(prompt) {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    const url = `${baseUrl}/messages`;
    
    console.log('🔗 Claude API URL:', url);
    console.log('🔑 API Key:', this.config.apiKey ? this.config.apiKey.substring(0, 10) + '...' : 'Missing');
    
    const response = await axios.post(url, {
      model: this.config.model,
      temperature: this.config.temperature,
      messages: [{
        role: 'user',
        content: prompt
      }],
      ...this.config.settings
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    return response.data.content[0].text;
  }

  async callCustom(prompt) {
    if (!this.config.baseUrl) {
      throw new Error('Base URL is required for custom API');
    }
    
    const url = `${this.config.baseUrl}/chat/completions`;
    
    console.log('🔗 Custom API URL:', url);
    console.log('🔑 API Key:', this.config.apiKey ? this.config.apiKey.substring(0, 10) + '...' : 'Missing');
    
    const response = await axios.post(url, {
      model: this.config.model,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: this.config.temperature,
      ...this.config.settings
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.config.settings.headers
      }
    });

    // Handle different response formats
    if (response.data.choices) {
      return response.data.choices[0].message.content;
    } else if (response.data.content) {
      return response.data.content;
    } else if (response.data.text) {
      return response.data.text;
    } else {
      return response.data;
    }
  }

  buildQuizPrompt(documentText, options = {}) {
    const { numQuestions = 5, difficulty = 'medium', type = 'mcq' } = options;
    
    // Build type-specific instructions
    let typeInstructions = '';
    let questionFormat = '';
    
    if (type === 'mcq') {
      typeInstructions = `Generate only multiple choice questions. Do NOT include any short, essay, or structured questions.`;
      questionFormat = `Each question should have 4 multiple choice options (A, B, C, D)`;
    } else if (type === 'essay') {
      typeInstructions = `Generate only short/essay style questions (1-3 sentence answers). Do NOT include any multiple choice questions.`;
      questionFormat = `Each question should require a short written answer (1-3 sentences)`;
    } else if (type === 'structured_essay') {
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions.`;
      questionFormat = `Each question should require a structured written answer with multiple parts`;
    } else if (type === 'mixed') {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
      questionFormat = `Include both multiple choice questions (with 4 options A, B, C, D) and short written answer questions`;
    }
    
    return `You are an expert quiz generator. Create ${numQuestions} quiz questions based on the following document text.

Document Text:
${documentText}

Requirements:
- Generate ${numQuestions} questions
- Difficulty level: ${difficulty}
- Question type: ${type}
- ${typeInstructions}
- ${questionFormat}
- Include the correct answer marked with [CORRECT] for MCQ or provide expected answer for essay questions
- Make questions relevant to the document content
- Ensure questions test understanding, not just memorization

Format your response as JSON with this structure:
{
  "questions": [
    {
      "type": "${type === 'mixed' ? 'mcq' : type}",
      "question": "Question text here?",
      "options": ${type === 'mcq' || type === 'mixed' ? '{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}' : 'null'},
      "correct": ${type === 'mcq' || type === 'mixed' ? '"A"' : '"Expected answer text"'},
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Return only the JSON, no additional text.`;
  }

  buildExplanationPrompt(question, answer, context) {
    return `You are an expert tutor. Provide a detailed explanation for this quiz question.

Question: ${question}
Correct Answer: ${answer}
Context: ${context}

Please provide:
1. Why the correct answer is right
2. Why other options are wrong (if applicable)
3. Additional context or examples to help understanding
4. Key concepts related to this question

Format your response in a clear, educational manner.`;
  }

  async testConfiguration(config) {
    const testPrompt = "Hello, this is a test message. Please respond with 'Test successful' to confirm the API is working.";
    
    try {
      const response = await this.callAI(testPrompt);
      return {
        success: true,
        response: response.response.substring(0, 100), // Extract response string and truncate for security
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Test failed: ${error.message}`);
    }
  }

  // Token estimation methods
  estimateGeminiTokens(prompt, response) {
    // Gemini uses a different tokenization, roughly 1 token per 4 characters
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }

  estimateOpenAITokens(prompt, response) {
    // OpenAI uses roughly 1 token per 4 characters for English text
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }

  estimateClaudeTokens(prompt, response) {
    // Claude uses roughly 1 token per 4 characters
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }

  estimateCustomTokens(prompt, response) {
    // Default estimation for custom APIs
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }
}

// Factory function to create AI service instance
const createAIService = async () => {
  const AIConfig = require('../models/AIConfig');
  
  try {
    console.log('🔍 Looking for active AI configuration...');
    const config = await AIConfig.findOne({ isActive: true }).select('+apiKey');
    
    if (!config) {
      throw new Error('No active AI configuration found. Please configure an AI service in the admin panel.');
    }
    
    console.log('✅ Found active AI configuration:', config.provider, '-', config.model);
    return new AIService(config);
  } catch (error) {
    console.error('❌ Error fetching AI configuration:', error.message);
    if (error.message.includes('buffering') || error.message.includes('ENOTFOUND')) {
      throw new Error('Database connection issue. Please check your internet connection and try again.');
    }
    throw error;
  }
};

// Test function for admin
const testAIConfiguration = async (config) => {
  const service = new AIService(config);
  return await service.testConfiguration(config);
};

module.exports = {
  AIService,
  createAIService,
  testAIConfiguration
};
