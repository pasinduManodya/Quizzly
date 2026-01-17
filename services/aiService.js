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
    const APIRotationManager = require('../utils/apiRotation');
    
    try {
      console.log(`🤖 Calling AI service: ${this.config.provider} - ${this.config.model}`);
      console.log(`📝 Prompt length: ${prompt.length} characters`);
      
      let result;
      let tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
      
      try {
        switch (this.config.provider) {
          case 'gemini':
            result = await this.callGemini(prompt);
            // Use actual token counts from Gemini if available, otherwise estimate
            if (result.tokenUsage) {
              tokenUsage = result.tokenUsage;
              result = result.response;
            } else {
              tokenUsage = this.estimateGeminiTokens(prompt, result);
            }
            break;
          case 'openai':
            result = await this.callOpenAI(prompt);
            if (result.tokenUsage) {
              tokenUsage = result.tokenUsage;
              result = result.response;
            } else {
              tokenUsage = this.estimateOpenAITokens(prompt, result);
            }
            break;
          case 'claude':
            result = await this.callClaude(prompt);
            if (result.tokenUsage) {
              tokenUsage = result.tokenUsage;
              result = result.response;
            } else {
              tokenUsage = this.estimateClaudeTokens(prompt, result);
            }
            break;
          case 'custom':
            result = await this.callCustom(prompt);
            if (result.tokenUsage) {
              tokenUsage = result.tokenUsage;
              result = result.response;
            } else {
              tokenUsage = this.estimateCustomTokens(prompt, result);
            }
            break;
          default:
            throw new Error(`Unsupported AI provider: ${this.config.provider}`);
        }
        
        // Record successful call
        await APIRotationManager.recordSuccess(this.config._id);
        console.log(`📊 Token usage: ${tokenUsage.totalTokens} tokens (${tokenUsage.promptTokens} prompt + ${tokenUsage.completionTokens} completion)`);
        
        return {
          response: result,
          tokenUsage: tokenUsage
        };
      } catch (error) {
        // Check if this is a credits exhausted error
        if (APIRotationManager.isCreditsExhaustedError(error)) {
          console.warn(`⚠️  Credits exhausted for ${this.config.provider}. Marking as exhausted...`);
          await APIRotationManager.markAsExhausted(this.config._id, error.message);
          
          // Try to get next available config and retry
          const nextConfig = await APIRotationManager.getNextAvailableConfig();
          if (nextConfig._id.toString() !== this.config._id.toString()) {
            console.log(`🔄 Retrying with next API: ${nextConfig.provider} - ${nextConfig.model}`);
            const nextService = new AIService(nextConfig);
            return await nextService.callAI(prompt);
          }
        } else {
          // Record failure for non-exhaustion errors
          await APIRotationManager.recordFailure(this.config._id, error.message);
        }
        
        throw error;
      }
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

    const responseText = candidate.content.parts[0].text;
    
    // Extract actual token usage from Gemini API response
    let tokenUsage = null;
    if (response.data.usageMetadata) {
      tokenUsage = {
        promptTokens: response.data.usageMetadata.promptTokenCount || 0,
        completionTokens: response.data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.data.usageMetadata.totalTokenCount || 0
      };
      console.log(`📊 Actual Gemini tokens: ${tokenUsage.promptTokens} input + ${tokenUsage.completionTokens} output = ${tokenUsage.totalTokens} total`);
    }

    return tokenUsage ? { response: responseText, tokenUsage } : responseText;
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
      typeInstructions = `Generate only multiple choice questions in the style of professional exams (UPSC, GATE, NEET, etc.). Do NOT include any short, essay, or structured questions.`;
      questionFormat = `Each question should have 4 multiple choice options (A, B, C, D). Create questions that are:
- Clear and unambiguous
- Test conceptual understanding and application
- Include plausible distractors
- Avoid "all of the above" or "none of the above" options`;
    } else if (type === 'essay') {
      typeInstructions = `Generate only short/essay style questions (1-3 sentence answers). Do NOT include any multiple choice questions.`;
      questionFormat = `Each question should require a short written answer (1-3 sentences)`;
    } else if (type === 'structured_essay') {
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions.`;
      questionFormat = `IMPORTANT: Each question MUST have multiple parts labeled as a), b), c), etc. Format the question text with parts on separate lines or clearly separated. Example format:
"Main question statement here?
a) First part of the question
b) Second part of the question
c) Third part of the question"`;
    } else if (type === 'mixed') {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions in professional exam format.`;
      questionFormat = `Include both multiple choice questions (with 4 options A, B, C, D) and short written answer questions`;
    }
    
    return `You are an expert educational content creator specializing in professional examinations. Create ${numQuestions} high-quality questions based on the following study material.

Study Material:
${documentText}

REQUIREMENTS:
- Generate exactly ${numQuestions} questions
- Difficulty level: ${difficulty}
- Question type: ${type}
- ${typeInstructions}
- ${questionFormat}
- Questions should be independent and not reference "according to the document"
- Use professional, exam-style language
- Test deeper understanding and application, not just memorization
- Vary question types (conceptual, analytical, applied, comparative)
- Include the correct answer for MCQ or expected answer for essay questions

QUALITY STANDARDS:
- Each question should be clear, concise, and unambiguous
- Options should be plausible but clearly distinguishable
- Questions should test important concepts and principles
- Avoid trivial or obvious questions
- Ensure questions are at the specified difficulty level

Format your response as JSON with this structure:
{
  "questions": [
    {
      "type": "${type === 'mixed' ? 'mcq' : type}",
      "question": "Question text here?",
      "options": ${type === 'mcq' || type === 'mixed' ? '{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}' : 'null'},
      "correct": ${type === 'mcq' || type === 'mixed' ? '"A"' : '"Expected answer text"'},
      "explanation": "Comprehensive explanation of the correct answer"
    }
  ]
}

Return only the JSON, no additional text.`;
  }

  buildExplanationPrompt(question, answer, context) {
    return `You are an expert educational tutor providing comprehensive, formal, and well-structured explanations for quiz questions.

**Question:** ${question}
**Correct Answer:** ${answer}
**Original Explanation:** ${context}

**Instructions:**
Create an enhanced explanation that is formal, professional, and easy to read. Use proper markdown formatting with clear sections and structure.

**Required Format:**

### Why the correct answer is right:
[Provide a detailed, formal explanation of why this answer is correct. Use professional language and be thorough.]

### Why other options are wrong:
[If this is a multiple choice question, explain why each incorrect option is wrong. Be specific and educational.]

### Key concepts and principles involved:
[List and explain the fundamental concepts, theories, or principles that are relevant to this question. Use bullet points for clarity:]
- **Concept 1**: Explanation
- **Concept 2**: Explanation
- **Concept 3**: Explanation

### Real-world applications or examples:
[Provide practical examples or real-world scenarios where this knowledge applies. Make it relatable and memorable.]

### Additional insights:
[Include any additional information, tips, or insights that would help deepen understanding of this topic.]

### Common misconceptions:
[If applicable, address common mistakes or misconceptions students might have about this topic.]

**Formatting Guidelines:**
- Use markdown headers (###) for main sections
- Use **bold** for emphasis on important terms
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) for sequential steps
- Keep paragraphs concise and focused
- Use professional, formal language
- Make it educational and comprehensive
- Ensure the explanation is easy to scan and read

Provide a complete, well-formatted response that helps students truly understand the concept.`;
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

  // Test method to verify API connectivity
  async test() {
    try {
      const testPrompt = "Test connection - please respond with 'OK' if you can read this message.";
      console.log(`🔍 Testing ${this.config.provider} - ${this.config.model}...`);
      
      const result = await this.callAI(testPrompt);
      
      return {
        success: true,
        message: '✅ API test successful',
        response: result.response
      };
    } catch (error) {
      console.error('Test error:', error);
      return {
        success: false,
        message: `❌ Test failed: ${error.message}`,
        error: error.message,
        details: {
          provider: this.config.provider,
          model: this.config.model,
          statusCode: error.response?.status,
          statusText: error.response?.statusText
        }
      };
    }
  }
}

// Factory function to create AI service instance
const createAIService = async () => {
  const APIRotationManager = require('../utils/apiRotation');
  
  try {
    console.log('🔍 Looking for best available AI configuration (priority-based)...');
    // Use APIRotationManager to get the best available config based on priority
    const config = await APIRotationManager.getNextAvailableConfig();
    
    if (!config) {
      throw new Error('No AI configuration found. Please configure an AI service in the admin panel.');
    }
    
    console.log(`✅ Selected AI configuration: ${config.provider} - ${config.model} (Priority: ${config.priority})`);
    return new AIService(config);
  } catch (error) {
    console.error('❌ Error fetching AI configuration:', error.message);
    if (error.message.includes('buffering') || error.message.includes('ENOTFOUND')) {
      throw new Error('Database connection issue. Please check your internet connection and try again.');
    }
    throw error;
  }
};

// Add test method to AIService class
AIService.prototype.test = async function() {
  try {
    const testPrompt = "Test connection - please respond with 'OK' if you can read this message.";
    console.log(`🔍 Testing ${this.config.provider} - ${this.config.model}...`);
    
    const result = await this.callAI(testPrompt);
    
    return {
      success: true,
      message: '✅ API test successful',
      response: result.response
    };
    } catch (error) {
      console.error('Test error:', error);
      throw error; // Re-throw to be handled by the caller
    }
  }

// Test function for admin
const testAIConfiguration = async (config) => {
  try {
    const service = new AIService(config);
    const result = await service.test();
    
    // If test was successful, just return the result
    if (result.success) {
      return result;
    }
    
    // If test failed, include more details
    return {
      success: false,
      message: result.message || 'API test failed',
      error: result.error,
      details: result.details || {
        provider: config.provider,
        model: config.model,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error in testAIConfiguration:', error);
    return {
      success: false,
      message: `Test failed: ${error.message}`,
      error: error.message,
      details: {
        provider: config?.provider,
        model: config?.model,
        timestamp: new Date().toISOString()
      }
    };
  }
};

module.exports = {
  AIService,
  createAIService,
  testAIConfiguration
};
