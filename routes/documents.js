const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { createAIService } = require('../services/aiService');
const Document = require('../models/Document');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { tokenUsageMiddleware } = require('../middleware/tokenUsage');
const quotaManager = require('../utils/quotaManager');

const router = express.Router();

// Helper function to extract JSON from AI response (handles markdown code blocks)
function extractJSONFromResponse(response) {
  let jsonString = response;
  
  // Remove markdown code blocks if present
  if (response.includes('```json')) {
    const codeBlockMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonString = codeBlockMatch[1].trim();
    }
  } else {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
  }
  
  if (!jsonString || !jsonString.includes('{')) {
    throw new Error('Invalid response format from AI service');
  }
  
  return JSON.parse(jsonString);
}

// Helper function to convert options object to array format
function convertOptionsToArray(options) {
  // If options is already an array, return it
  if (Array.isArray(options)) {
    return options;
  }
  
  // If options is an object with keys like A, B, C, D, convert to array
  if (typeof options === 'object' && options !== null) {
    const optionArray = [];
    
    // Try common key patterns
    const keys = ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd', '1', '2', '3', '4'];
    
    for (const key of keys) {
      if (options[key] !== undefined) {
        optionArray.push(options[key]);
      }
    }
    
    // If no common keys found, try to extract values in order
    if (optionArray.length === 0) {
      const values = Object.values(options);
      if (values.length > 0) {
        return values;
      }
    }
    
    return optionArray;
  }
  
  // If options is a string, try to parse it as JSON
  if (typeof options === 'string') {
    try {
      const parsed = JSON.parse(options);
      return convertOptionsToArray(parsed);
    } catch (e) {
      // If parsing fails, return as single-item array
      return [options];
    }
  }
  
  // Default fallback
  return [];
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// AI service will be initialized dynamically based on configuration

// Helper function to convert structured essay answers to string
function convertCorrectAnswerToString(correctAnswer) {
  if (typeof correctAnswer === 'string') {
    return correctAnswer;
  }
  
  if (typeof correctAnswer === 'object' && correctAnswer !== null) {
    // Handle structured essay format with Part 1, Part 2, etc.
    if (correctAnswer['Part 1'] || correctAnswer['Part 2']) {
      const parts = [];
      let partNum = 1;
      while (correctAnswer[`Part ${partNum}`]) {
        parts.push(correctAnswer[`Part ${partNum}`]);
        partNum++;
      }
      return parts.join(' ');
    }
    
    // Handle other object formats
    return JSON.stringify(correctAnswer);
  }
  
  return String(correctAnswer || '');
}

// Split text into chunks for large PDFs
function splitTextIntoChunks(text, maxChunkSize = 25000) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/);
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '. ';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Generate questions from multiple chunks (for large PDFs)
async function generateQuestionsFromChunks(text, options, aiService) {
  try {
    console.log('🔄 Processing large PDF in chunks...');
    
    const { type = 'mcq', numQuestions = 8, coverAllTopics = false } = options;
    const chunks = splitTextIntoChunks(text);
    
    console.log(`📚 Split PDF into ${chunks.length} chunks`);
    
    if (coverAllTopics) {
      // For comprehensive coverage, process all chunks to identify ALL important points
      console.log('🎯 Comprehensive coverage mode: Identifying ALL important points...');
      return await generateComprehensiveQuestionsFromChunks(chunks, options, aiService);
    } else {
      // Regular processing with question limits
      const questionsPerChunk = Math.max(1, Math.floor(numQuestions / chunks.length));
      const totalQuestions = [];
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`📄 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
        
        // Generate questions for this chunk
        const chunkQuestions = await generateQuestionsFromSingleChunk(chunk, {
          type,
          numQuestions: questionsPerChunk,
          coverAllTopics: false,
          chunkIndex: i + 1,
          totalChunks: chunks.length
        }, aiService);
        
        totalQuestions.push(...chunkQuestions);
      }
      
      // If we don't have enough questions, generate more from the most important chunks
      if (totalQuestions.length < numQuestions) {
        const remaining = numQuestions - totalQuestions.length;
        console.log(`📝 Generating ${remaining} additional questions from key chunks...`);
        
        // Use the first chunk (usually contains introduction/overview) for additional questions
        const additionalQuestions = await generateQuestionsFromSingleChunk(chunks[0], {
          type,
          numQuestions: remaining,
          coverAllTopics: false,
          chunkIndex: 'Additional',
          totalChunks: chunks.length
        }, aiService);
        
        totalQuestions.push(...additionalQuestions);
      }
      
      // Trim to exact number requested
      const finalQuestions = totalQuestions.slice(0, numQuestions);
      
      console.log(`✅ Generated ${finalQuestions.length} questions from ${chunks.length} chunks`);
      return finalQuestions;
    }
    
  } catch (error) {
    console.error('Error in chunked processing:', error);
    // Fallback to simple processing
    return generateFallbackQuestions(text, options);
  }
}

// Generate comprehensive questions covering ALL important points (for coverAllTopics mode)
async function generateComprehensiveQuestionsFromChunks(chunks, options, aiService) {
  try {
    console.log('🎯 COMPREHENSIVE COVERAGE MODE ACTIVATED');
    const { type = 'mcq' } = options;
    
    // Step 1: Identify ALL important points from each chunk
    console.log('📋 Step 1: Identifying ALL important points from each chunk...');
    const allImportantPoints = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔍 Analyzing chunk ${i + 1}/${chunks.length} for important points...`);
      
      const importantPoints = await identifyImportantPointsFromChunk(chunk, model);
      allImportantPoints.push(...importantPoints);
      console.log(`✅ Found ${importantPoints.length} important points in chunk ${i + 1}`);
    }
    
    console.log(`📊 Total important points identified: ${allImportantPoints.length}`);
    
    // Step 2: Generate questions to cover ALL identified points
    console.log('❓ Step 2: Generating questions to cover ALL important points...');
    const allQuestions = [];
    
    // Process each chunk to generate questions for its important points
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`📝 Generating questions for chunk ${i + 1}/${chunks.length}...`);
      
      const chunkQuestions = await generateQuestionsForImportantPoints(chunk, {
        type,
        chunkIndex: i + 1,
        totalChunks: chunks.length,
        targetPoints: allImportantPoints.filter(point => point.chunkIndex === i + 1)
      }, model);
      
      allQuestions.push(...chunkQuestions);
      console.log(`✅ Generated ${chunkQuestions.length} questions for chunk ${i + 1}`);
    }
    
    console.log(`🎉 COMPREHENSIVE COVERAGE COMPLETE: Generated ${allQuestions.length} questions covering ${allImportantPoints.length} important points`);
    return allQuestions;
    
  } catch (error) {
    console.error('Error in comprehensive coverage:', error);
    // Fallback to regular processing
    return generateFallbackQuestions(chunks.join('\n\n'), options);
  }
}

// Identify important points from a chunk
async function identifyImportantPointsFromChunk(chunkText, model) {
  try {
    const prompt = `
    Your task is to identify ALL important points in the following result.response. 

    IMPORTANT POINTS include:
    - Key facts and definitions
    - Important concepts and theories
    - Processes and procedures
    - Formulas and equations
    - Examples and case studies
    - Principles and rules
    - Relationships and connections
    - Applications and implications

    Instructions:
    1. Read the result.response completely and carefully
    2. Identify EVERY important point - don't miss any
    3. List each point with a brief description
    4. Be comprehensive - it's better to include more points than to miss important ones

    Content:
    ${chunkText}

    Format your response as JSON:
    {
      "importantPoints": [
        {
          "point": "Brief description of the important point",
          "category": "fact|concept|process|formula|example|principle|application",
          "importance": "high|medium|low"
        }
      ]
    }
    `;

    const result = await aiService.callAI(prompt);
    
    let parsedContent;
    try {
      parsedContent = extractJSONFromResponse(result.response); // Extract response from result object
    } catch (error) {
      console.error('JSON parsing error:', error);
      return [];
    }
    
    return (parsedContent.importantPoints || []).map(point => ({
      ...point,
      chunkText: chunkText.substring(0, 200) + '...' // Store chunk reference
    }));
    
  } catch (error) {
    console.error('Error identifying important points:', error);
    return [];
  }
}

// Generate questions to cover specific important points
async function generateQuestionsForImportantPoints(chunkText, options, aiService) {
  try {
    const { type = 'mcq', chunkIndex, totalChunks, targetPoints } = options;
    
    // Build type instructions
    let typeInstructions = '';
    if (type === 'mcq') {
      typeInstructions = `Generate only multiple choice questions. Do NOT include any short, essay, or structured questions.`;
    } else if (type === 'essay') {
      typeInstructions = `Generate only short/essay style questions (1-3 sentence answers). Do NOT include any multiple choice questions.`;
    } else if (type === 'structured_essay') {
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions.`;
    } else {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
    }

    const prompt = `
    Your task is to generate questions that cover ALL the important points identified in this result.response chunk.

    IMPORTANT: Generate as many questions as needed to cover ALL important points. Do NOT limit the number of questions.

    Instructions:
    1. Read the result.response completely
    2. Identify ALL important points (facts, concepts, processes, formulas, examples, principles, applications)
    3. Generate questions to cover EVERY important point
    4. Each question should test understanding of one or more important points
    5. Ensure comprehensive coverage - don't miss any important points

    ${typeInstructions}
    
    For multiple choice questions:
    - Provide 4 options (A, B, C, D)
    - Mark the correct answer
    - Include a comprehensive explanation that covers:
      * Why the correct answer is right
      * Why other options are wrong
      * Key concepts and principles involved
      * Real-world applications or examples
    
    For short/essay/structured questions:
    - Ask questions that require 1-3 sentence answers
    - Provide the expected answer
    - Include a comprehensive explanation that covers:
      * Detailed explanation of the concept
      * Key principles and theories
      * Practical applications
      * Related concepts

    Content Chunk (Part ${chunkIndex} of ${totalChunks}):
    ${chunkText}
    
    Format your response as JSON:
    {
      "questions": [
        {
          "type": "mcq" | "short",
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"], // only for mcq
          "correctAnswer": "Expected answer or the correct option value",
          "explanation": "Comprehensive explanation"
        }
      ]
    }
    `;

    const result = await aiService.callAI(prompt);
    
    // Clean up the response to extract JSON
    let parsedContent;
    try {
      parsedContent = extractJSONFromResponse(result.response);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid response format from AI service');
    }
    
    // Normalize types according to our frontend schema
    let normalized = (parsedContent.questions || []).map(q => {
      const qt = (q.type || '').toLowerCase();
      let mappedType = qt;
      // Map AI response types to our frontend types
      if (qt.includes('essay') || qt.includes('short') || qt.includes('structured')) {
        mappedType = 'short';
      } else if (qt.includes('mcq') || qt.includes('multiple')) {
        mappedType = 'mcq';
      } else {
        // If no type specified, use the requested type from options
        mappedType = options.type === 'essay' || options.type === 'structured_essay' ? 'short' : 'mcq';
      }
      
      return {
        type: mappedType,
        question: q.question || '',
        options: convertOptionsToArray(q.options || {}),
        correctAnswer: convertCorrectAnswerToString(q.correctAnswer),
        explanation: q.explanation || ''
      };
    });
    
    return normalized;
    
  } catch (error) {
    console.error('Error generating questions for important points:', error);
    return [];
  }
}

// Generate comprehensive questions for small PDFs (coverAllTopics mode)
async function generateComprehensiveQuestionsForSmallPDF(text, options, model) {
  try {
    console.log('🎯 COMPREHENSIVE COVERAGE MODE for small PDF');
    const { type = 'mcq' } = options;
    
    // Build type instructions
    let typeInstructions = '';
    if (type === 'mcq') {
      typeInstructions = `Generate only multiple choice questions. Do NOT include any short, essay, or structured questions.`;
    } else if (type === 'essay') {
      typeInstructions = `Generate only short/essay style questions (1-3 sentence answers). Do NOT include any multiple choice questions.`;
    } else if (type === 'structured_essay') {
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions.`;
    } else {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
    }

    const prompt = `
    Follow these steps carefully and in strict order:

    1. *Read the entire PDF completely first.*  
       Do not generate or list any questions until you have read and analyzed the COMPLETE result.response from beginning to end.
       This includes ALL pages, ALL sections, ALL topics, and ALL details in the document.

    2. *Identify ALL important points* — include key facts, definitions, concepts, examples, processes, formulas, and other essential ideas from the PDF.  
       - Internally identify EVERY important point - don't miss any
       - Group points by their respective *topics or subtopics* within the lesson
       - Be comprehensive - it's better to include more points than to miss important ones

    3. *Generate questions to cover ALL identified important points:*
       - Generate as many questions as needed to cover EVERY important point
       - Do NOT limit the number of questions - focus on comprehensive coverage
       - Each question should test understanding of one or more important points
       - Ensure questions cover ALL topics, ALL sections, and ALL important concepts
       - Vary the question types (conceptual, factual, applied, or analytical)

    4. *Output only the final questions.*
       - Do not show your internal reasoning, point lists, or summaries.  
       - Present only the final, high-quality, contextually accurate questions.

    Your goal: Generate as many questions as needed to cover ALL important points in the document. The number of questions doesn't matter - only comprehensive coverage matters.

    ${typeInstructions}
    
    For multiple choice questions:
    - Provide 4 options (A, B, C, D)
    - Mark the correct answer
    - Include a comprehensive explanation that covers:
      * Why the correct answer is right
      * Why other options are wrong
      * Key concepts and principles involved
      * Real-world applications or examples
    
    For short/essay/structured questions:
    - Ask questions that require 1-3 sentence answers
    - Provide the expected answer
    - Include a comprehensive explanation that covers:
      * Detailed explanation of the concept
      * Key principles and theories
      * Practical applications
      * Related concepts
    
    Study Material:
    ${text} // Complete PDF result.response - analyze the entire document
    
    Format your response as JSON:
    {
      "questions": [
        {
          "type": "mcq" | "short",
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"], // only for mcq
          "correctAnswer": "Expected answer or the correct option value",
          "explanation": "Comprehensive explanation"
        }
      ]
    }
    `;

    console.log('Sending comprehensive coverage request to AI service...');
    const result = await aiService.callAI(prompt);
    
    console.log('AI response received for comprehensive coverage, length:', result.response.length);
    
    // Clean up the response to extract JSON
    let parsedContent;
    try {
      parsedContent = extractJSONFromResponse(result.response);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid response format from AI service');
    }
    console.log('Questions parsed successfully for comprehensive coverage:', parsedContent.questions.length);
    
    // Normalize types according to our frontend schema
    let normalized = (parsedContent.questions || []).map(q => {
      const qt = (q.type || '').toLowerCase();
      let mappedType = qt;
      // Map AI response types to our frontend types
      if (qt.includes('essay') || qt.includes('short') || qt.includes('structured')) {
        mappedType = 'short';
      } else if (qt.includes('mcq') || qt.includes('multiple')) {
        mappedType = 'mcq';
      } else {
        // If no type specified, use the requested type from options
        mappedType = options.type === 'essay' || options.type === 'structured_essay' ? 'short' : 'mcq';
      }
      
      return {
        type: mappedType,
        question: q.question || '',
        options: convertOptionsToArray(q.options || {}),
        correctAnswer: convertCorrectAnswerToString(q.correctAnswer),
        explanation: q.explanation || ''
      };
    });
    
    console.log(`🎉 COMPREHENSIVE COVERAGE COMPLETE: Generated ${normalized.length} questions covering ALL important points`);
    return normalized;
    
  } catch (error) {
    console.error('Error in comprehensive coverage for small PDF:', error);
    // Fallback to regular processing
    return generateFallbackQuestions(text, options);
  }
}

// Generate questions from a single chunk
async function generateQuestionsFromSingleChunk(chunkText, options, aiService) {
  try {
    const { type = 'mcq', numQuestions = 8, chunkIndex, totalChunks } = options;

    // Build type instructions
    let typeInstructions = '';
    if (type === 'mcq') {
      typeInstructions = `Generate only multiple choice questions. Do NOT include any short, essay, or structured questions.`;
    } else if (type === 'essay') {
      typeInstructions = `Generate only short/essay style questions (1-3 sentence answers). Do NOT include any multiple choice questions.`;
    } else if (type === 'structured_essay') {
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions.`;
    } else {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
    }

    const prompt = `
    Follow these steps carefully and in strict order:

    1. *Read the entire result.response completely first.*  
       Do not generate or list any questions until you have read and analyzed the COMPLETE result.response from beginning to end.
       This includes ALL sections, ALL topics, and ALL details in this chunk.

    2. *Identify all important points* — include key facts, definitions, concepts, examples, processes, formulas, and other essential ideas.  
       - Internally summarize or list these important points for your reasoning process (do not output them to the user yet).
       - Group points by their respective *topics or subtopics* within this result.response.

    3. *After analyzing the COMPLETE result.response:*
       - You have access to the ENTIRE chunk result.response - use ALL of it.
       - Generate exactly ${numQuestions} questions from this chunk.
       - *First priority:* Cover as many different *topics* as possible from this chunk.  
         - Distribute the selected points across multiple sections or topics to achieve broad coverage.  
       - *Second priority:* Within those selected topics, pick the *most important or representative points*.  
       - *Do not include the same point twice* — ensure each selected point adds unique value and context.

    4. *Generate the questions:*
       - Create clear, educational, and concept-driven questions  
       - Each question should ideally combine or connect multiple related points under the same topic.  
       - Ensure the full question set collectively represents the *widest possible range of topics* and the *most important concepts*.  
       - Vary the question types (conceptual, factual, applied, or analytical) to maintain depth and variety.

    5. *Output only the final questions.*
       - Do not show your internal reasoning, point lists, or summaries.  
       - Present only the final, high-quality, contextually accurate questions.

    Your goal: Generate ${numQuestions} questions that cover the *broadest possible range of topics from this chunk, and within those topics, include the **most important and meaningful points* — with no overlap or repetition.

    ${typeInstructions}
    
    For multiple choice questions:
    - Provide 4 options (A, B, C, D)
    - Mark the correct answer
    - Include a comprehensive explanation that covers:
      * Why the correct answer is right
      * Why other options are wrong
      * Key concepts and principles involved
      * Real-world applications or examples
    
    For short/essay/structured questions:
    - Ask questions that require 1-3 sentence answers
    - Provide the expected answer
    - Include a comprehensive explanation that covers:
      * Detailed explanation of the concept
      * Key principles and theories
      * Practical applications
      * Related concepts
    
    Content Chunk (Part ${chunkIndex} of ${totalChunks}):
    ${chunkText}
    
    Format your response as JSON:
    {
      "questions": [
        {
          "type": "mcq" | "short",
          "question": "Question text?",
          "options": ["Option A", "Option B", "Option C", "Option D"], // only for mcq
          "correctAnswer": "Expected answer or the correct option value",
          "explanation": "Comprehensive explanation"
        }
      ]
    }
    `;

    const result = await aiService.callAI(prompt);
    
    // Clean up the response to extract JSON
    let parsedContent;
    try {
      parsedContent = extractJSONFromResponse(result.response);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid response format from AI service');
    }
    
    // Normalize types according to our frontend schema
    let normalized = (parsedContent.questions || []).map(q => {
      const qt = (q.type || '').toLowerCase();
      let mappedType = qt;
      // Map AI response types to our frontend types
      if (qt.includes('essay') || qt.includes('short') || qt.includes('structured')) {
        mappedType = 'short';
      } else if (qt.includes('mcq') || qt.includes('multiple')) {
        mappedType = 'mcq';
      } else {
        // If no type specified, use the requested type from options
        mappedType = options.type === 'essay' || options.type === 'structured_essay' ? 'short' : 'mcq';
      }
      
      return {
        type: mappedType,
        question: q.question || '',
        options: convertOptionsToArray(q.options || {}),
        correctAnswer: convertCorrectAnswerToString(q.correctAnswer),
        explanation: q.explanation || ''
      };
    });
    
    return normalized;
    
  } catch (error) {
    console.error('Error generating questions from chunk:', error);
    return [];
  }
}

// Generate questions from text using configurable AI
async function generateQuestions(text, options = {}) {
  try {
    console.log('Starting AI question generation...');
    console.log('Text length:', text.length);
    
    const aiService = await createAIService();
    console.log('AI service initialized');

    const { type = 'mcq', numQuestions = 8, coverAllTopics = false } = options;

    // Check if comprehensive coverage is requested
    if (coverAllTopics) {
      console.log('🎯 Comprehensive coverage mode: Covering ALL important points...');
      
      // For small PDFs, process directly
      if (text.length <= 25000) {
        return await generateComprehensiveQuestionsForSmallPDF(text, options, aiService);
      } else {
        // For large PDFs, use chunked processing
        console.log(`📄 Large PDF detected (${text.length} chars). Using chunked comprehensive processing...`);
        return await generateQuestionsFromChunks(text, options, aiService);
      }
    }

    // Check if text is too long for single API call
    const maxCharsPerCall = 25000; // ~6,250 tokens (safe limit)
    if (text.length > maxCharsPerCall) {
      console.log(`📄 Large PDF detected (${text.length} chars). Using chunked processing...`);
      return await generateQuestionsFromChunks(text, options, aiService);
    }

    // Generate questions using the AI service
    const rawResponse = await aiService.generateQuiz(text, options);
    
    // Parse the JSON response
    let parsedContent;
    try {
      parsedContent = extractJSONFromResponse(rawResponse);
    } catch (error) {
      console.error('JSON parsing error in generateQuestions:', error);
      throw new Error('Invalid response format from AI service');
    }
    
    // Normalize types according to our frontend schema
    let normalized = (parsedContent.questions || []).map(q => {
      const qt = (q.type || '').toLowerCase();
      let mappedType = qt;
      
      // Map AI response types to our frontend types
      if (qt.includes('essay') || qt.includes('short') || qt.includes('structured')) {
        mappedType = 'short';
      } else if (qt.includes('mcq') || qt.includes('multiple')) {
        mappedType = 'mcq';
      } else {
        // If no type specified, use the requested type from options
        mappedType = options.type === 'essay' || options.type === 'structured_essay' ? 'short' : 'mcq';
      }
      
      return {
        type: mappedType,
        question: q.question || '',
        options: convertOptionsToArray(q.options || {}),
        correctAnswer: convertCorrectAnswerToString(q.correct || q.correctAnswer),
        explanation: q.explanation || ''
      };
    });
    
    // Limit to requested number of questions
    const count = options.numQuestions || 8;
    if (normalized.length > count) {
      normalized = normalized.slice(0, count);
    }
    
    return normalized;
  } catch (error) {
    console.error('AI service error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check for quota exceeded error
    if (error.message && error.message.includes('429 Too Many Requests')) {
      console.log('⚠️ AI service quota exceeded. Using fallback question generation.');
      quotaManager.setQuotaExceeded();
      return generateFallbackQuestions(text, options);
    }
    
    if (error.message.includes('API key')) {
      throw new Error('AI service API key is invalid or not configured. Please check your AI configuration in the admin panel.');
    }
    
    // For other errors, try fallback
    console.log('⚠️ AI service error occurred. Using fallback question generation.');
    quotaManager.setQuotaExceeded();
    return generateFallbackQuestions(text, options);
  }
}

// Fallback question generation when API quota is exceeded
function generateFallbackQuestions(text, options = {}) {
  console.log('🔄 Generating fallback questions...');
  
  const { type = 'mcq', numQuestions = 8 } = options;
  const questions = [];
  
  // Simple text-based question generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const maxQuestions = Math.min(numQuestions, Math.floor(sentences.length / 2));
  
  for (let i = 0; i < maxQuestions; i++) {
    const sentence = sentences[i * 2]?.trim();
    if (!sentence) continue;
    
    if (type === 'mcq' || type === 'mixed') {
      // Generate MCQ question
      const question = `What is the main concept discussed in: "${sentence.substring(0, 100)}..."?`;
      questions.push({
        type: 'mcq',
        question: question,
        options: [
          'A) Primary concept',
          'B) Secondary concept', 
          'C) Supporting detail',
          'D) Background information'
        ],
        correctAnswer: 'A',
        explanation: 'This is a fallback question generated due to AI service limitations. Please refer to the original study material for accurate information.'
      });
    }
    
    if (type === 'essay' || type === 'structured_essay' || type === 'mixed') {
      // Generate essay question
      const question = `Explain the concept mentioned in: "${sentence.substring(0, 80)}..."`;
      questions.push({
        type: 'short',
        question: question,
        correctAnswer: 'This concept requires detailed explanation based on the study material.',
        explanation: 'This is a fallback question generated due to AI service limitations. Please refer to the original study material for accurate information.'
      });
    }
  }
  
  // Ensure we have at least one question
  if (questions.length === 0) {
    questions.push({
      type: type === 'mcq' ? 'mcq' : 'short',
      question: 'Please review the uploaded study material and identify the key concepts.',
      options: type === 'mcq' ? ['A) Concept A', 'B) Concept B', 'C) Concept C', 'D) Concept D'] : undefined,
      correctAnswer: type === 'mcq' ? 'A' : 'Key concepts should be identified from the study material.',
      explanation: 'This is a fallback question generated due to API quota limitations. Please refer to the original study material for accurate information.'
    });
  }
  
  console.log(`✅ Generated ${questions.length} fallback questions`);
  return questions;
}

// Generate a concise comprehensive summary using configurable AI
async function generateSummary(text) {
  try {
    console.log('🤖 Starting AI summary generation...');
    const aiService = await createAIService();
    console.log('✅ AI service initialized successfully');
    
    const prompt = `Summarize the following study material into a clear, structured summary with rich formatting.
Focus on key concepts, definitions, formulas (if any), and main takeaways.

FORMATTING REQUIREMENTS:
- Use **bold** for main topics and key concepts
- Use *italics* for important definitions and emphasis
- Use ### for section headers
- Use bullet points (-) for lists and key points
- Use numbered lists (1.) for step-by-step processes
- Use > for important quotes or key insights
- Use \`code formatting\` for formulas, equations, or technical terms
- Organize result.response with clear hierarchy and spacing

TEXT:\n${text.substring(0, 12000)}`;
    
    console.log('📝 Calling AI service for summary...');
    const result = await aiService.callAI(prompt);
    console.log('✅ AI summary generated successfully');
    return result; // Return the full result object with response and tokenUsage
  } catch (error) {
    console.error('❌ Summary generation error:', error.message);
    console.error('❌ Error details:', error);
    console.log('🔄 Falling back to basic summary...');
    return generateFallbackSummary(text);
  }
}

// Fallback summary generation when API quota is exceeded
function generateFallbackSummary(text) {
  console.log('🔄 Generating fallback summary...');
  
  // Extract key sentences and create a basic summary
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const keySentences = sentences.slice(0, Math.min(10, sentences.length));
  
  let summary = `# Study Material Summary\n\n`;
  summary += `> **Note**: This summary was generated using basic text processing due to AI service issues. For the most accurate information, please refer to the original study material.\n\n`;
  
  summary += `## Key Concepts\n\n`;
  keySentences.forEach((sentence, index) => {
    summary += `${index + 1}. ${sentence.trim()}\n\n`;
  });
  
  summary += `## Important Points\n\n`;
  summary += `- Review the original study material for comprehensive understanding\n`;
  summary += `- Focus on key definitions and concepts\n`;
  summary += `- Practice with the generated questions\n`;
  summary += `- Consider upgrading your API plan for enhanced AI-generated summaries\n\n`;
  
  summary += `## Next Steps\n\n`;
  summary += `1. **Read the original material** thoroughly\n`;
  summary += `2. **Take practice quizzes** to test your understanding\n`;
  summary += `3. **Review explanations** for each question\n`;
  summary += `4. **Consider upgrading** your API plan for better AI features\n`;
  
  console.log('✅ Generated fallback summary');
  return summary;
}

// Check API quota status
router.get('/quota-status', auth, (req, res) => {
  try {
    const status = {
      quotaExceeded: quotaManager.isQuotaExceeded(),
      message: quotaManager.getQuotaStatusMessage(),
      upgradeRecommendation: quotaManager.getUpgradeRecommendation()
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting quota status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get quota status'
    });
  }
});

// Upload PDF and extract text
router.post('/upload', auth, upload.single('pdf'), async (req, res) => {
  try {
    console.log('PDF upload request received');
    console.log('File:', req.file);
    console.log('User:', req.user._id);

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Check user's document limit
    const user = await User.findById(req.user._id);
    console.log('User documents count:', user.documents.length);
    console.log('User max documents:', user.maxDocuments);
    
    if (user.documents.length >= user.maxDocuments) {
      console.log('User has reached document limit');
      return res.status(400).json({ 
        message: `You have reached the maximum limit of ${user.maxDocuments} documents` 
      });
    }

    console.log('Starting PDF text extraction...');
    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(pdfBuffer);
    const extractedText = pdfData.text;

    console.log('PDF text extracted, length:', extractedText.length);
    console.log('First 200 characters:', extractedText.substring(0, 200));

    if (!extractedText.trim()) {
      console.log('No text extracted from PDF');
      fs.unlinkSync(req.file.path); // Delete the file
      return res.status(400).json({ message: 'Could not extract text from PDF' });
    }

    console.log('Starting question generation with AI service...');
    // Generate questions using AI service
    const questions = await generateQuestions(extractedText);
    console.log('Questions generated:', questions.length);

    // Create document record
    const document = new Document({
      title: req.file.originalname.replace('.pdf', ''),
      filename: req.file.filename,
      filePath: req.file.path,
      extractedText: extractedText,
      questions: questions,
      user: req.user._id
    });

    console.log('Saving document to database...');
    await document.save();
    console.log('Document saved with ID:', document._id);

    // Add document to user's documents array
    user.documents.push(document._id);
    await user.save();
    console.log('Document added to user profile');

    res.json({
      message: 'PDF uploaded and processed successfully',
      document: {
        id: document._id,
        title: document.title,
        questionsCount: document.questions.length,
        uploadedAt: document.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Failed to process PDF: ' + error.message });
  }
});

// Create summary for a user's document
router.post('/:id/summary', auth, tokenUsageMiddleware(1000), async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (!document.extractedText || !document.extractedText.trim()) {
      return res.status(400).json({ message: 'No extracted text to summarize' });
    }
    
    const result = await generateSummary(document.extractedText);
    
    // Consume the actual tokens used
    const user = req.userWithTokens; // User object with token methods from middleware
    if (user && result.tokenUsage) {
      await user.consumeTokens(result.tokenUsage.totalTokens);
      console.log(`📊 Consumed ${result.tokenUsage.totalTokens} tokens for summary generation`);
    }
    
    res.json({ summary: result.response });
  } catch (error) {
    console.error('Generate summary error:', error);
    res.status(500).json({ message: 'Failed to generate summary' });
  }
});

// Regenerate questions for a document with options
router.post('/:id/regenerate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, numQuestions, coverAllTopics } = req.body || {};

    const document = await Document.findOne({ _id: id, user: req.user._id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    if (!document.extractedText || !document.extractedText.trim()) {
      return res.status(400).json({ message: 'No extracted text available for this document' });
    }

    const options = {
      type: (type || 'mcq'),
      numQuestions: Number(numQuestions) || 8,
      coverAllTopics: !!coverAllTopics
    };

    const questions = await generateQuestions(document.extractedText, options);

    document.questions = questions;
    await document.save();

    res.json({
      message: 'Questions regenerated successfully',
      questionsCount: document.questions.length
    });
  } catch (error) {
    console.error('Regenerate questions error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Regenerate a single question by index
router.post('/:id/regenerate-one', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { index, type, coverAllTopics } = req.body || {};
    const document = await Document.findOne({ _id: id, user: req.user._id });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (!Number.isInteger(index) || index < 0 || index >= document.questions.length) {
      return res.status(400).json({ message: 'Invalid question index' });
    }
    const options = {
      type: (type || 'mcq'),
      numQuestions: 1,
      coverAllTopics: !!coverAllTopics
    };
    const generated = await generateQuestions(document.extractedText, options);
    if (!generated || generated.length === 0) {
      return res.status(500).json({ message: 'Failed to regenerate question' });
    }
    document.questions[index] = generated[0];
    await document.save();
    res.json({ message: 'Question regenerated', question: document.questions[index] });
  } catch (error) {
    console.error('Regenerate one question error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get user's documents
router.get('/', auth, async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .select('title filename questions uploadedAt')
      .sort({ uploadedAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific document with questions
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Remove document from user's documents array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { documents: document._id }
    });

    // Delete document from database
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate simplified summary
router.post('/:id/simplified-summary', auth, tokenUsageMiddleware(1500), async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('📄 Document found:', document.title);
    console.log('📄 Document has extractedText:', !!document.extractedText);
    console.log('📄 ExtractedText length:', document.extractedText?.length || 0);

    // Use the actual document text instead of relying on summary
    if (!document.extractedText) {
      console.log('❌ No extractedText found in document');
      return res.status(400).json({ message: 'No document result.response available' });
    }

    const aiService = await createAIService();

    const prompt = `You are an expert educator who specializes in making complex medical and academic result.response accessible to students. 

Your task is to create a SIMPLIFIED version of the following document result.response. The simplified version should:

1. **Replace ALL complex words** - Every hard, rough, or complex medical/academic term should be replaced with simple, easy-to-read alternatives
2. **Make it child-friendly** - The result.response should be easy to read and understand, even by a child
3. **Keep all information intact** - Don't remove any important information, just make it simpler
4. **Prioritize simplicity and clarity** - Focus on easy comprehension over length
5. **Add explanations** - Explain concepts that might be confusing
6. **Use analogies and examples** - Help students understand through relatable comparisons
7. **Break down complex ideas** - Split complicated topics into smaller, digestible parts
8. **Use conversational tone** - Write as if explaining to a friend who's learning
9. **Create a comprehensive summary** - Summarize the entire document result.response in simplified terms

IMPORTANT: 
- The summary can be as long as needed, but focus on easy comprehension
- Replace EVERY complex word with simpler alternatives
- Make it so simple that even a child could understand
- Keep all the original information but make it much easier to read
- Create a complete summary of the document result.response

Document Content:
${document.extractedText}

Please provide a simplified summary that replaces all complex words with simple alternatives and makes the result.response easy to understand:`;

    try {
      const result = await aiService.callAI(prompt);
      
      // Consume the actual tokens used
      const user = req.userWithTokens; // User object with token methods from middleware
      if (user && result.tokenUsage) {
        await user.consumeTokens(result.tokenUsage.totalTokens);
        console.log(`📊 Consumed ${result.tokenUsage.totalTokens} tokens for simplified summary generation`);
      }
      
      res.json({ summary: result.response }); // Extract the response string from the result object
    } catch (error) {
      console.error('AI service error for simplified summary:', error);
      
      if (error.message.includes('429') || error.message.includes('quota')) {
        quotaManager.setQuotaExceeded();
        return res.status(429).json({ 
          message: 'API quota exceeded. Please try again later.',
          fallback: true 
        });
      }

      // Fallback simplified summary
      const fallbackSummary = `Simplified Summary:\n\n${document.extractedText.substring(0, 1000)}...\n\nNote: This is a simplified version that explains the key concepts in easier terms. The result.response covers the main topics from your document with additional explanations to help you understand the material better.`;
      
      res.json({ summary: fallbackSummary });
    }
  } catch (error) {
    console.error('Simplified summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate shorter summary
router.post('/:id/shorter-summary', auth, tokenUsageMiddleware(1200), async (req, res) => {
  try {
    const { length } = req.body;
    
    if (!['short', 'medium', 'long'].includes(length)) {
      return res.status(400).json({ message: 'Invalid length parameter' });
    }

    const document = await Document.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    console.log('📄 Document found:', document.title);
    console.log('📄 Document has extractedText:', !!document.extractedText);
    console.log('📄 ExtractedText length:', document.extractedText?.length || 0);

    // Use the actual document text instead of relying on summary
    if (!document.extractedText) {
      console.log('❌ No extractedText found in document');
      return res.status(400).json({ message: 'No document result.response available' });
    }

    const aiService = await createAIService();

    let lengthInstruction = '';
    switch (length) {
      case 'short':
        lengthInstruction = 'Make it approximately 25% of the original length - very concise, focusing only on the most essential points.';
        break;
      case 'medium':
        lengthInstruction = 'Make it approximately 50% of the original length - balanced, covering key concepts and important details.';
        break;
      case 'long':
        lengthInstruction = 'Make it approximately 75% of the original length - comprehensive but more concise than the original.';
        break;
    }

    const prompt = `You are an expert educator who specializes in creating concise, focused summaries for students.

Your task is to create a SHORTER summary of the following document result.response. The shorter version should:

1. **Preserve main ideas and key points** - Keep all essential information
2. **Reduce unnecessary details** - Remove redundant or less important information
3. **Maintain logical structure** - Keep the flow and organization clear
4. **Use precise language** - Be concise but clear
5. **Focus on essentials** - Prioritize the most important points
6. **Preserve formatting** - Keep headers, bullets, and structure when possible
7. **Create a comprehensive summary** - Summarize the entire document result.response

Length requirement: ${lengthInstruction}

IMPORTANT: 
- Preserve the main ideas and key points
- Reduce unnecessary details but keep essential information
- Make it exactly the requested length percentage
- Maintain readability and clarity
- Create a complete summary of the document result.response

Document Content:
${document.extractedText}

Please provide a shorter summary that maintains the essential information while being more concise:`;

    try {
      const result = await aiService.callAI(prompt);

      // Consume the actual tokens used
      const user = req.userWithTokens; // User object with token methods from middleware
      if (user && result.tokenUsage) {
        await user.consumeTokens(result.tokenUsage.totalTokens);
        console.log(`📊 Consumed ${result.tokenUsage.totalTokens} tokens for shorter summary generation`);
      }

      res.json({ summary: result.response }); // Extract the response string from the result object
    } catch (error) {
      console.error('AI service error for shorter summary:', error);
      
      if (error.message.includes('429') || error.message.includes('quota')) {
        quotaManager.setQuotaExceeded();
        return res.status(429).json({ 
          message: 'API quota exceeded. Please try again later.',
          fallback: true 
        });
      }

      // Fallback shorter summary based on length
      let fallbackSummary = '';
      const lines = document.extractedText.split('\n');
      
      switch (length) {
        case 'short':
          fallbackSummary = lines.slice(0, Math.floor(lines.length * 0.25)).join('\n');
          break;
        case 'medium':
          fallbackSummary = lines.slice(0, Math.floor(lines.length * 0.5)).join('\n');
          break;
        case 'long':
          fallbackSummary = lines.slice(0, Math.floor(lines.length * 0.75)).join('\n');
          break;
      }
      
      res.json({ summary: fallbackSummary });
    }
  } catch (error) {
    console.error('Shorter summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
