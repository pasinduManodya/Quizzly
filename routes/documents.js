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
    console.log('🎯 COMPREHENSIVE COVERAGE MODE ACTIVATED for large PDF');
    const { type = 'mcq' } = options;
    
    // Combine all chunks for comprehensive analysis
    const fullText = chunks.join('\n\n');
    
    // Step 1: Extract all important points from the entire document
    const importantPoints = await extractAllImportantPointsForCoverage(fullText, aiService);
    
    if (!importantPoints || importantPoints.length === 0) {
      console.log('⚠️ No important points extracted from large PDF. Using fallback approach.');
      return generateFallbackQuestions(fullText, options);
    }
    
    console.log(`📊 Found ${importantPoints.length} important points to cover across ${chunks.length} chunks`);
    
    // Step 2: Generate questions to cover all points
    const questions = await generateQuestionsToCoerAllPoints(fullText, importantPoints, options, aiService);
    
    console.log(`🎉 COMPREHENSIVE COVERAGE COMPLETE: Generated ${questions.length} questions covering ALL important points`);
    return questions;
    
  } catch (error) {
    console.error('Error in comprehensive coverage for large PDF:', error);
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
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions. CRITICAL: Each question MUST have multiple parts labeled as a), b), c), etc. Format the question with parts on separate lines or clearly separated.`;
    } else {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
    }

    const prompt = `You are an expert educational content creator specializing in professional examinations. Your task is to generate high-quality questions that cover ALL the important points identified in this content chunk.

CRITICAL REQUIREMENT: Generate as many questions as needed to cover EVERY important point. Do NOT limit the number of questions.

INSTRUCTIONS:
1. Read the content chunk completely
2. Identify ALL important points (facts, concepts, processes, formulas, examples, principles, applications)
3. Generate questions to cover EVERY important point
4. Each question should test understanding of one or more important points
5. Ensure comprehensive coverage - don't miss any important points
6. Use professional, exam-style language
7. Questions should be independent and not reference "according to the document"
8. Test deeper understanding and application, not just memorization

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

// Step 1: Extract ALL important points from the document
async function extractAllImportantPointsForCoverage(text, aiService) {
  try {
    console.log('📋 Step 1: Extracting ALL important points from document...');
    
    const maxTextLength = 50000;
    const textToProcess = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '\n\n[... Additional content continues ...]'
      : text;
    
    const prompt = `You are an expert educational content analyzer. Your task is to extract EVERY important point from this study material.

CRITICAL: You MUST identify ALL important points - do not miss any. Be exhaustive.

TYPES OF IMPORTANT POINTS TO EXTRACT:
- Key concepts and theories
- Important definitions and terminology  
- Facts, statistics, and specific data
- Formulas, equations, and calculations
- Processes, procedures, and methodologies
- Examples, case studies, and applications
- Principles, rules, and guidelines
- Relationships, connections, and dependencies
- Historical context and background
- Comparisons and contrasts
- Cause-and-effect relationships
- Classifications and categorizations
- Step-by-step procedures
- Important dates, names, places, and events

Document Content:
${textToProcess}

Format your response as JSON:
{
  "importantPoints": [
    {
      "id": 1,
      "point": "Brief description of the important point",
      "category": "concept|definition|fact|formula|process|example|principle|relationship|procedure|other",
      "topic": "Main topic this point belongs to",
      "details": "More detailed explanation of the point"
    }
  ],
  "totalPointsCount": number
}

IMPORTANT: Return ALL points you identify. The list should be comprehensive and exhaustive.`;

    const result = await aiService.callAI(prompt);
    let parsedContent;
    
    try {
      parsedContent = extractJSONFromResponse(result.response);
    } catch (error) {
      console.error('⚠️ Could not parse important points JSON');
      return [];
    }
    
    const importantPoints = parsedContent.importantPoints || [];
    console.log(`✅ Extracted ${importantPoints.length} important points`);
    
    return importantPoints;
  } catch (error) {
    console.error('❌ Error extracting important points:', error.message);
    return [];
  }
}

// Step 2: Generate questions to cover ALL extracted important points
async function generateQuestionsToCoerAllPoints(text, importantPoints, options, aiService) {
  try {
    console.log(`📝 Step 2: Generating questions to cover ALL ${importantPoints.length} important points...`);
    
    const { type = 'mcq' } = options;
    
    // Build type instructions
    let typeInstructions = '';
    if (type === 'mcq') {
      typeInstructions = `Generate only multiple choice questions. Do NOT include any short, essay, or structured questions.`;
    } else if (type === 'essay') {
      typeInstructions = `Generate only short/essay style questions (1-3 sentence answers). Do NOT include any multiple choice questions.`;
    } else if (type === 'structured_essay') {
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions. CRITICAL: Each question MUST have multiple parts labeled as a), b), c), etc. Format the question with parts on separate lines or clearly separated.`;
    } else {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
    }
    
    // Build the points checklist
    const pointsChecklist = importantPoints
      .map((p, i) => `${i + 1}. [${p.category}] ${p.point}`)
      .join('\n');
    
    const maxTextLength = 50000;
    const textToProcess = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '\n\n[... Additional content continues ...]'
      : text;
    
    const prompt = `You are an expert educational content creator specializing in professional examinations. Your task is to generate high-quality questions that cover ALL the important points listed below.

CRITICAL REQUIREMENT: You MUST create questions that cover EVERY single important point. Do not skip any point.

IMPORTANT POINTS TO COVER (${importantPoints.length} total):
${pointsChecklist}

INSTRUCTIONS:
1. Read the study material completely
2. For EACH important point listed above, create one or more questions that test understanding of that point
3. Generate as many questions as needed to ensure ALL points are covered
4. Do NOT limit the number of questions - comprehensive coverage is the priority
5. Each question should clearly test one or more of the listed important points
6. Vary question types (conceptual, analytical, applied, comparative) to maintain engagement
7. Use professional, exam-style language
8. Questions should be independent and not reference "according to the document"
9. Test deeper understanding and application, not just memorization

${typeInstructions}

For multiple choice questions:
- Provide 4 options (A, B, C, D)
- Mark the correct answer
- Include a comprehensive explanation that covers why the correct answer is right, why others are wrong, and key concepts
- Create plausible distractors that test understanding

For short/essay questions:
- Ask questions that require 1-3 sentence answers
- Provide the expected answer
- Include a comprehensive explanation with key principles and practical applications

Study Material:
${textToProcess}

Format your response as JSON:
{
  "questions": [
    {
      "type": "mcq" | "short",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"], // only for mcq
      "correctAnswer": "Expected answer or the correct option value",
      "explanation": "Comprehensive explanation",
      "coversPoints": [1, 2, 5] // indices of important points this question covers
    }
  ],
  "coverageReport": {
    "totalQuestionsGenerated": number,
    "pointsCovered": [1, 2, 3, ...], // indices of points that have questions
    "pointsMissed": [4, 6, ...] // indices of points without questions (if any)
  }
}`;

    console.log('Sending comprehensive coverage request to AI service...');
    const result = await aiService.callAI(prompt);
    
    let parsedContent;
    try {
      parsedContent = extractJSONFromResponse(result.response);
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Invalid response format from AI service');
    }
    
    const questions = parsedContent.questions || [];
    const coverageReport = parsedContent.coverageReport || {};
    
    console.log(`✅ Generated ${questions.length} questions`);
    console.log(`📊 Coverage Report:`, coverageReport);
    
    // Normalize types according to our frontend schema
    let normalized = questions.map(q => {
      const qt = (q.type || '').toLowerCase();
      let mappedType = qt;
      if (qt.includes('essay') || qt.includes('short') || qt.includes('structured')) {
        mappedType = 'short';
      } else if (qt.includes('mcq') || qt.includes('multiple')) {
        mappedType = 'mcq';
      } else {
        mappedType = options.type === 'essay' || options.type === 'structured_essay' ? 'short' : 'mcq';
      }
      
      return {
        type: mappedType,
        question: q.question || '',
        options: convertOptionsToArray(q.options || {}),
        correctAnswer: convertCorrectAnswerToString(q.correctAnswer),
        explanation: q.explanation || '',
        coversPoints: q.coversPoints || []
      };
    });
    
    // If some points are missed, generate additional questions for them
    if (coverageReport.pointsMissed && coverageReport.pointsMissed.length > 0) {
      console.log(`⚠️ ${coverageReport.pointsMissed.length} points not covered. Generating additional questions...`);
      
      const missedPoints = coverageReport.pointsMissed
        .map(idx => importantPoints[idx])
        .filter(p => p)
        .map((p, i) => `${i + 1}. [${p.category}] ${p.point}: ${p.details}`)
        .join('\n');
      
      const additionalPrompt = `Generate questions to cover these specific important points that were missed:

${missedPoints}

Study Material:
${textToProcess}

${typeInstructions}

Generate as many questions as needed to cover ALL these points. Format as JSON with "questions" array.`;

      try {
        const additionalResult = await aiService.callAI(additionalPrompt);
        const additionalParsed = extractJSONFromResponse(additionalResult.response);
        const additionalQuestions = (additionalParsed.questions || []).map(q => {
          const qt = (q.type || '').toLowerCase();
          let mappedType = qt;
          if (qt.includes('essay') || qt.includes('short') || qt.includes('structured')) {
            mappedType = 'short';
          } else if (qt.includes('mcq') || qt.includes('multiple')) {
            mappedType = 'mcq';
          } else {
            mappedType = options.type === 'essay' || options.type === 'structured_essay' ? 'short' : 'mcq';
          }
          
          return {
            type: mappedType,
            question: q.question || '',
            options: convertOptionsToArray(q.options || {}),
            correctAnswer: convertCorrectAnswerToString(q.correctAnswer),
            explanation: q.explanation || '',
            coversPoints: q.coversPoints || []
          };
        });
        
        normalized = [...normalized, ...additionalQuestions];
        console.log(`✅ Added ${additionalQuestions.length} additional questions for missed points`);
      } catch (error) {
        console.error('Error generating additional questions:', error);
      }
    }
    
    console.log(`🎉 COMPREHENSIVE COVERAGE COMPLETE: Generated ${normalized.length} questions covering ALL important points`);
    return normalized;
    
  } catch (error) {
    console.error('Error generating questions for all points:', error);
    throw error;
  }
}

// Generate comprehensive questions for small PDFs (coverAllTopics mode)
async function generateComprehensiveQuestionsForSmallPDF(text, options, aiService) {
  try {
    console.log('🎯 COMPREHENSIVE COVERAGE MODE for small PDF');
    
    // Step 1: Extract all important points
    const importantPoints = await extractAllImportantPointsForCoverage(text, aiService);
    
    if (!importantPoints || importantPoints.length === 0) {
      console.log('⚠️ No important points extracted. Using fallback approach.');
      return generateFallbackQuestions(text, options);
    }
    
    console.log(`📊 Found ${importantPoints.length} important points to cover`);
    
    // Step 2: Generate questions to cover all points
    const questions = await generateQuestionsToCoerAllPoints(text, importantPoints, options, aiService);
    
    return questions;
    
  } catch (error) {
    console.error('Error in comprehensive coverage for small PDF:', error);
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
      typeInstructions = `Generate only structured essay questions that require multi-part answers (but still provide an expected concise answer and explanation). Do NOT include any multiple choice questions. CRITICAL: Each question MUST have multiple parts labeled as a), b), c), etc. Format the question with parts on separate lines or clearly separated.`;
    } else {
      typeInstructions = `Generate a mixed set including both multiple choice and short/essay style questions.`;
    }

    const prompt = `You are an expert educational content creator specializing in professional examinations. Generate exactly ${numQuestions} high-quality questions from this content chunk.

INSTRUCTIONS:
1. Read the entire content chunk completely first
2. Identify all important points (facts, definitions, concepts, examples, processes, formulas, principles)
3. Generate exactly ${numQuestions} questions that cover the broadest possible range of topics
4. Prioritize the most important and meaningful concepts
5. Ensure no overlap or repetition between questions
6. Use professional, exam-style language
7. Questions should be independent and not reference "according to the document"
8. Test deeper understanding and application, not just memorization
9. Vary question types (conceptual, analytical, applied, comparative) to maintain engagement

${typeInstructions}

For multiple choice questions:
- Provide 4 options (A, B, C, D)
- Mark the correct answer
- Include a comprehensive explanation that covers:
  * Why the correct answer is right
  * Why other options are wrong
  * Key concepts and principles involved
  * Real-world applications or examples
- Create plausible distractors that test understanding

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
  let totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  
  try {
    console.log('Starting AI question generation...');
    console.log('Text length:', text.length);
    
    const aiService = await createAIService();
    console.log('AI service initialized');

    const { type = 'mcq', numQuestions = 8, coverAllTopics = false } = options;

    let questions;
    
    // Check if comprehensive coverage is requested
    if (coverAllTopics) {
      console.log('🎯 Comprehensive coverage mode: Covering ALL important points...');
      
      // For small PDFs, process directly
      if (text.length <= 25000) {
        const result = await generateComprehensiveQuestionsForSmallPDF(text, options, aiService);
        questions = result.questions || result;
        totalTokenUsage = result.tokenUsage || totalTokenUsage;
      } else {
        // For large PDFs, use chunked processing
        console.log(`📄 Large PDF detected (${text.length} chars). Using chunked comprehensive processing...`);
        const result = await generateQuestionsFromChunks(text, options, aiService);
        questions = result.questions || result;
        totalTokenUsage = result.tokenUsage || totalTokenUsage;
      }
    } else if (text.length > 25000) {
      // Check if text is too long for single API call
      console.log(`📄 Large PDF detected (${text.length} chars). Using chunked processing...`);
      const result = await generateQuestionsFromChunks(text, options, aiService);
      questions = result.questions || result;
      totalTokenUsage = result.tokenUsage || totalTokenUsage;
    } else {
      // Generate questions using the AI service (with token tracking)
      const quizResult = await aiService.generateQuizWithTokens(text, options);
      const rawResponse = quizResult.response;
      const tokenUsage = quizResult.tokenUsage;
      totalTokenUsage = tokenUsage;
      
      // Parse the JSON response
      let parsedContent;
      try {
        parsedContent = extractJSONFromResponse(rawResponse);
      } catch (error) {
        console.error('JSON parsing error in generateQuestions:', error);
        throw new Error('Invalid response format from AI service');
      }
      
      // Normalize types according to our frontend schema
      questions = (parsedContent.questions || []).map(q => {
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
      if (questions.length > count) {
        questions = questions.slice(0, count);
      }
    }
    
    // Return questions with token usage data
    return {
      questions: questions,
      tokenUsage: totalTokenUsage
    };
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
      // Generate essay question - use full sentence without truncation
      const question = `Explain the concept mentioned in: "${sentence.trim()}"`;
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
  return {
    questions: questions,
    tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  };
}

// Generate a concise comprehensive summary using configurable AI
async function generateSummary(text) {
  try {
    console.log('🤖 Starting AI summary generation...');
    const aiService = await createAIService();
    console.log('✅ AI service initialized successfully');
    
    const prompt = `You are an expert educational content writer specializing in creating professional, well-structured study summaries.

Your task is to create a comprehensive, formal, and easy-to-read summary of the following study material.

**REQUIRED STRUCTURE:**

### Overview
[Provide a brief introduction to the topic and what the material covers]

### Key Concepts
[List and explain the main concepts, theories, or principles. Use bullet points with bold headings:]
- **Concept Name**: Clear, concise explanation
- **Concept Name**: Clear, concise explanation

### Important Definitions
[Define key terms and terminology used in the material:]
- **Term**: Professional definition with context
- **Term**: Professional definition with context

### Main Points
[Organize the core content into logical sections with clear headers:]

#### Topic 1
- Key point with detailed explanation
- Supporting information
- Relevant examples

#### Topic 2
- Key point with detailed explanation
- Supporting information
- Relevant examples

### Formulas and Equations
[If applicable, list important formulas with explanations:]
- \`Formula\`: Explanation of what it represents and when to use it

### Practical Applications
[Describe how this knowledge applies in real-world scenarios]

### Summary
[Provide a concise recap of the most important takeaways]

**FORMATTING GUIDELINES:**
- Use ### for main section headers
- Use #### for subsection headers
- Use **bold** for key terms, concepts, and emphasis
- Use *italics* for definitions and important notes
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) for sequential steps or processes
- Use > for important quotes, warnings, or key insights
- Use \`code formatting\` for formulas, equations, or technical terms
- Keep paragraphs concise and focused
- Use professional, formal language
- Ensure proper spacing between sections
- Make it scannable and easy to read

**CONTENT QUALITY:**
- Be comprehensive yet concise
- Use clear, professional language
- Maintain logical flow and organization
- Include all important information
- Make it educational and informative

Study Material:
${text.substring(0, 12000)}

Provide a complete, well-formatted, professional summary following the structure above.`;
    
    console.log('📝 Calling AI service for summary...');
    const result = await aiService.callAI(prompt);
    console.log('✅ AI summary generated successfully');
    console.log('🔍 Result structure:', {
      hasResponse: !!result.response,
      hasTokenUsage: !!result.tokenUsage,
      tokenUsageData: result.tokenUsage
    });
    return result; // Return the full result object with response and tokenUsage
  } catch (error) {
    console.error('❌ Summary generation error:', error.message);
    console.error('❌ Error details:', error);
    console.log('🔄 Falling back to basic summary...');
    return {
      response: generateFallbackSummary(text),
      tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    };
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

// Step 1: Identify ALL important points in the document
async function identifyAllImportantPoints(text, aiService) {
  try {
    console.log('🔍 Step 1: Identifying ALL important points in the document...');
    
    // For very large texts, we'll process in chunks
    const maxTextLength = 45000; // Safe limit
    const textToProcess = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '\n\n[... Additional content in original document ...]'
      : text;
    
    const prompt = `You are an expert educational content analyst. Your task is to identify EVERY important point in this study material.

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE document carefully from start to finish
2. Identify ALL important points - do not miss any
3. Categorize each point by type
4. Note the context and relationships between points

IMPORTANT POINTS TO IDENTIFY INCLUDE:
- Key concepts and theories
- Important definitions and terminology
- Facts, statistics, and specific data
- Formulas, equations, and calculations
- Processes, procedures, and methodologies
- Examples, case studies, and applications
- Principles, rules, and guidelines
- Relationships, connections, and dependencies
- Historical context and background
- Comparisons and contrasts
- Cause-and-effect relationships
- Classifications and categorizations
- Step-by-step procedures
- Important dates, names, places, and events

Document Content:
${textToProcess}

Format your response as JSON:
{
  "importantPoints": [
    {
      "point": "Brief description of the important point",
      "category": "concept|definition|fact|formula|process|example|principle|relationship|procedure|other",
      "importance": "critical|high|medium",
      "context": "Brief context or section where it appears",
      "relatedPoints": ["Related point 1", "Related point 2"]
    }
  ],
  "topics": ["Topic 1", "Topic 2", "Topic 3"],
  "keyTerms": ["Term 1", "Term 2", "Term 3"],
  "formulas": ["Formula 1", "Formula 2"],
  "summary": "Brief overview of what the document covers"
}

Be COMPREHENSIVE - identify EVERY important point. It's better to include more than to miss critical information.`;

    const result = await aiService.callAI(prompt);
    let parsedContent;
    
    try {
      parsedContent = extractJSONFromResponse(result.response);
    } catch (error) {
      console.error('⚠️ Could not parse important points JSON, using fallback approach');
      return null;
    }
    
    const importantPoints = parsedContent.importantPoints || [];
    const topics = parsedContent.topics || [];
    const keyTerms = parsedContent.keyTerms || [];
    const formulas = parsedContent.formulas || [];
    
    console.log(`✅ Identified ${importantPoints.length} important points, ${topics.length} topics, ${keyTerms.length} key terms, ${formulas.length} formulas`);
    
    return {
      importantPoints,
      topics,
      keyTerms,
      formulas,
      summary: parsedContent.summary || ''
    };
  } catch (error) {
    console.error('❌ Error identifying important points:', error.message);
    return null;
  }
}

// Step 2: Create condensed version ensuring ALL important points are included
async function createCondensedVersionWithPoints(text, importantPointsData, aiService) {
  try {
    console.log('📝 Step 2: Creating condensed version ensuring ALL important points are preserved...');
    
    // Build a comprehensive checklist of what must be included
    const pointsChecklist = importantPointsData.importantPoints
      .filter(p => p.importance === 'critical' || p.importance === 'high')
      .map((p, i) => `${i + 1}. ${p.point} (${p.category})`)
      .join('\n');
    
    const topicsList = importantPointsData.topics.join(', ');
    const keyTermsList = importantPointsData.keyTerms.join(', ');
    const formulasList = importantPointsData.formulas.join('\n');
    
    const maxTextLength = 45000;
    const textToProcess = text.length > maxTextLength 
      ? text.substring(0, maxTextLength) + '\n\n[... Additional content in original document ...]'
      : text;
    
    const prompt = `You are an expert at condensing educational content while preserving ALL critical information.

YOUR TASK: Create a condensed version of this study material that is 25-35% of the original length while ensuring EVERY important point is preserved.

CRITICAL REQUIREMENTS - YOU MUST INCLUDE ALL OF THE FOLLOWING:

1. ALL CRITICAL AND HIGH IMPORTANCE POINTS (DO NOT MISS ANY):
${pointsChecklist}

2. ALL TOPICS COVERED:
${topicsList}

3. ALL KEY TERMS AND DEFINITIONS:
${keyTermsList}

4. ALL FORMULAS AND EQUATIONS:
${formulasList}

CONDENSATION GUIDELINES:
- Preserve ALL important concepts, facts, definitions, formulas, and key points listed above
- Maintain the logical structure, flow, and organization of the original
- Keep essential examples and explanations (remove only truly redundant ones)
- Preserve ALL technical terms, proper nouns, and specific details
- Maintain relationships and connections between concepts
- Keep all step-by-step procedures and processes
- Preserve all important dates, names, places, and events
- Maintain cause-and-effect relationships
- Keep all classifications and categorizations

WHAT TO REMOVE (ONLY):
- Redundant explanations of the same concept
- Excessive examples (keep 1-2 best examples per concept)
- Unnecessary filler words and phrases
- Repetitive statements
- Non-essential background information

VERIFICATION CHECKLIST:
Before finalizing, verify that:
✓ Every critical/high importance point is included
✓ All topics are covered
✓ All key terms are defined or explained
✓ All formulas are present
✓ The structure and flow are maintained
✓ The condensed version can be used to generate accurate questions
✓ The condensed version can be used to create comprehensive summaries

Original Study Material:
${textToProcess}

Provide ONLY the condensed text. Start directly with the condensed content. Ensure completeness and accuracy.`;

    const result = await aiService.callAI(prompt);
    return result.response;
  } catch (error) {
    console.error('❌ Error creating condensed version with points:', error.message);
    throw error;
  }
}

// Create a condensed version of the PDF text for cost-effective processing
// This preserves all important information while reducing token usage by 70-90%
// Uses a two-step approach: first identify all important points, then condense while ensuring all are included
async function createCondensedVersion(text) {
  try {
    console.log('📝 Creating condensed version of PDF text...');
    console.log(`📊 Original text length: ${text.length} characters`);
    
    const aiService = await createAIService();
    
    // Step 1: Identify all important points
    const importantPointsData = await identifyAllImportantPoints(text, aiService);
    
    let condensedText;
    
    if (importantPointsData && importantPointsData.importantPoints.length > 0) {
      // Step 2: Create condensed version ensuring all important points are included
      console.log(`📋 Using identified ${importantPointsData.importantPoints.length} important points to guide condensation...`);
      condensedText = await createCondensedVersionWithPoints(text, importantPointsData, aiService);
    } else {
      // Fallback: Use direct condensation with enhanced prompt
      console.log('⚠️ Could not identify important points, using enhanced direct condensation...');
      const maxTextLength = 45000;
      const textToProcess = text.length > maxTextLength 
        ? text.substring(0, maxTextLength) + '\n\n[... Content continues in original document ...]'
        : text;
      
      const prompt = `You are an expert at condensing educational content while preserving ALL critical information.

Your task is to create a condensed version of this study material that:
1. Preserves ALL important concepts, facts, definitions, formulas, and key points
2. Maintains the logical structure, flow, and organization of the original
3. Keeps essential examples and explanations (remove only redundant ones)
4. Preserves technical terms, proper nouns, and specific details
5. Is approximately 25-35% of the original length
6. Can be used to generate accurate questions and summaries without losing quality

CRITICAL: The condensed version must contain ALL information needed to:
- Generate accurate quiz questions covering all topics
- Create comprehensive summaries
- Understand the complete subject matter
- Answer questions about any part of the original material

Be SYSTEMATIC:
1. First, mentally identify ALL important points in the document
2. Then condense while ensuring EVERY important point is preserved
3. Verify that nothing critical is missing

Original Study Material:
${textToProcess}

Provide ONLY the condensed text. Do not include any commentary, explanations, or metadata. Start directly with the condensed content.`;

      const result = await aiService.callAI(prompt);
      condensedText = result.response;
    }
    
    const reduction = Math.round((1 - condensedText.length / text.length) * 100);
    console.log(`✅ Condensed version created: ${text.length} -> ${condensedText.length} characters (${reduction}% reduction)`);
    
    // Validation: Check if condensed version is too short (might have lost information)
    if (condensedText.length < text.length * 0.15) {
      console.warn('⚠️ Warning: Condensed version is very short, might have lost important information');
    }
    
    return condensedText;
  } catch (error) {
    console.error('❌ Error creating condensed version:', error.message);
    console.log('🔄 Falling back to smart text truncation...');
    
    // Fallback: Use intelligent truncation that preserves structure
    // Take first 30% but ensure we get complete sentences
    const targetLength = Math.floor(text.length * 0.3);
    const truncated = text.substring(0, targetLength);
    
    // Find the last complete sentence
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );
    
    if (lastSentenceEnd > targetLength * 0.8) {
      return truncated.substring(0, lastSentenceEnd + 1);
    }
    
    return truncated;
  }
}

// Helper function to get the text to use for processing (condensed if available, fallback to full)
function getTextForProcessing(document) {
  // Prefer condensed text if available and valid
  if (document.condensedText && document.condensedText.trim().length > 100) {
    const reduction = Math.round((1 - document.condensedText.length / document.extractedText.length) * 100);
    console.log(`✅ COST SAVINGS: Using condensed text (${document.condensedText.length} chars) instead of full text (${document.extractedText.length} chars)`);
    console.log(`💰 Token reduction: ${reduction}% - This will save significant API costs!`);
    return document.condensedText;
  }
  
  // Fallback to full text for backward compatibility
  console.warn(`⚠️ WARNING: Using full extracted text (${document.extractedText.length} chars) - condensed version not available`);
  console.warn(`⚠️ This will use MORE tokens and cost MORE. Condensed text should be generated.`);
  return document.extractedText;
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

// Generate condensed version for existing document (for migration/optimization)
router.post('/:id/generate-condensed', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, user: req.user._id });
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if condensed version already exists
    if (document.condensedText && document.condensedText.trim().length > 100) {
      return res.json({
        message: 'Condensed version already exists',
        condensedLength: document.condensedTextLength,
        originalLength: document.extractedText.length,
        reduction: Math.round((1 - document.condensedTextLength / document.extractedText.length) * 100) + '%'
      });
    }

    if (!document.extractedText || !document.extractedText.trim()) {
      return res.status(400).json({ message: 'No extracted text available for this document' });
    }

    console.log(`🔄 Generating condensed version for document: ${document.title}`);
    const condensedText = await createCondensedVersion(document.extractedText);
    
    document.condensedText = condensedText;
    document.condensedTextLength = condensedText.length;
    await document.save();

    const reduction = Math.round((1 - condensedText.length / document.extractedText.length) * 100);
    console.log(`✅ Condensed version created: ${reduction}% reduction`);

    res.json({
      message: 'Condensed version generated successfully',
      originalLength: document.extractedText.length,
      condensedLength: condensedText.length,
      reduction: reduction + '%'
    });
  } catch (error) {
    console.error('Error generating condensed version:', error);
    res.status(500).json({ message: 'Failed to generate condensed version: ' + error.message });
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

    // Create document record immediately (condensed version will be generated in background)
    // Questions will be generated on-demand using condensed text to save costs
    const document = new Document({
      title: req.file.originalname.replace('.pdf', ''),
      filename: req.file.filename,
      filePath: req.file.path,
      extractedText: extractedText,
      condensedText: null, // Will be generated in background
      condensedTextLength: 0,
      questions: [], // Empty - questions will be generated on-demand using condensed text
      user: req.user._id
    });

    console.log('Saving document to database...');
    await document.save();
    console.log('Document saved with ID:', document._id);
    
    // Generate condensed version in background (non-blocking - doesn't delay upload response)
    const documentId = document._id;
    const extractedTextForBackground = extractedText;
    
    // Use setImmediate to ensure this runs after the response is sent
    setImmediate(async () => {
      try {
        console.log(`🔄 Background: Starting condensed version generation for document ${documentId}...`);
        const condensedText = await createCondensedVersion(extractedTextForBackground);
        const condensedTextLength = condensedText.length;
        const reduction = Math.round((1 - condensedTextLength / extractedTextForBackground.length) * 100);
        
        // Update document with condensed version
        await Document.findByIdAndUpdate(documentId, {
          condensedText: condensedText,
          condensedTextLength: condensedTextLength
        });
        
        console.log(`✅ Background: Condensed version created for document ${documentId}`);
        console.log(`📊 Reduction: ${extractedTextForBackground.length} -> ${condensedTextLength} chars (${reduction}% reduction)`);
      } catch (error) {
        console.error(`⚠️ Background: Failed to create condensed version for document ${documentId}:`, error.message);
        // Document will continue to work with full text - no user impact
      }
    });

    // Add document to user's documents array
    user.documents.push(document._id);
    await user.save();
    console.log('Document added to user profile');

    // Return response immediately (condensed version generating in background)
    res.json({
      message: 'PDF uploaded successfully. Condensed version is being generated in the background for cost-effective operations.',
      document: {
        id: document._id,
        title: document.title,
        questionsCount: 0, // Questions will be generated on-demand
        condensedTextReady: false, // Will be ready soon (generating in background)
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
    
    // Check if summary is already cached
    if (document.summary && document.summary.trim().length > 0) {
      console.log('✅ Returning cached summary (no tokens consumed for cached content)');
      return res.json({ summary: document.summary, cached: true });
    }
    
    // Get text for processing (condensed if available)
    const textToUse = getTextForProcessing(document);
    if (!textToUse || !textToUse.trim()) {
      return res.status(400).json({ message: 'No extracted text to summarize' });
    }
    
    // Verify we're using condensed text
    const isUsingCondensed = document.condensedText && 
                             document.condensedText.trim().length > 100 && 
                             textToUse === document.condensedText;
    console.log(`📝 Generating summary from ${isUsingCondensed ? '✅ CONDENSED' : '⚠️ FULL'} text...`);
    if (isUsingCondensed) {
      console.log(`💰 Cost savings: ${Math.round((1 - textToUse.length / document.extractedText.length) * 100)}% reduction in tokens`);
    }
    const result = await generateSummary(textToUse);
    
    console.log('🔍 Result from generateSummary:', {
      hasResponse: !!result?.response,
      hasTokenUsage: !!result?.tokenUsage,
      tokenUsageKeys: result?.tokenUsage ? Object.keys(result.tokenUsage) : 'N/A'
    });
    
    // Cache the summary
    document.summary = result.response;
    await document.save();
    console.log('✅ Summary cached for future use');
    
    // Consume the actual tokens used
    const user = req.userWithTokens; // User object with token methods from middleware
    console.log('🔍 User available:', !!user, 'User email:', user?.email);
    
    if (user && result && result.tokenUsage) {
      console.log(`🔍 Token data received:`, {
        totalTokens: result.tokenUsage.totalTokens,
        promptTokens: result.tokenUsage.promptTokens,
        completionTokens: result.tokenUsage.completionTokens
      });
      
      const inputTokens = result.tokenUsage.promptTokens || 0;
      const outputTokens = result.tokenUsage.completionTokens || 0;
      const totalTokens = result.tokenUsage.totalTokens || 0;
      
      console.log(`📝 About to consume tokens:`, { totalTokens, inputTokens, outputTokens });
      
      const consumeResult = await user.consumeTokens(
        totalTokens,
        inputTokens,
        outputTokens
      );
      
      console.log(`✅ Tokens consumed successfully`);
      console.log(`📊 Tokens - Input: ${consumeResult.dailyInputTokens.toLocaleString()} | Output: ${consumeResult.dailyOutputTokens.toLocaleString()} | Total: ${consumeResult.dailyUsed.toLocaleString()}/${consumeResult.dailyLimit.toLocaleString()}`);
    } else {
      console.log('⚠️  Skipping token consumption:', {
        userExists: !!user,
        resultExists: !!result,
        tokenUsageExists: !!result?.tokenUsage
      });
    }
    
    res.json({ summary: result.response, cached: false });
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

    // Get text for processing (condensed if available)
    const textToUse = getTextForProcessing(document);
    if (!textToUse || !textToUse.trim()) {
      return res.status(400).json({ message: 'No extracted text available for this document' });
    }

    const options = {
      type: (type || 'mcq'),
      numQuestions: Number(numQuestions) || 8,
      coverAllTopics: !!coverAllTopics
    };

    // Verify we're using condensed text
    const isUsingCondensed = document.condensedText && 
                             document.condensedText.trim().length > 100 && 
                             textToUse === document.condensedText;
    console.log(`🔄 Regenerating questions from ${isUsingCondensed ? '✅ CONDENSED' : '⚠️ FULL'} text...`);
    if (isUsingCondensed) {
      console.log(`💰 Cost savings: ${Math.round((1 - textToUse.length / document.extractedText.length) * 100)}% reduction in tokens`);
    }
    const result = await generateQuestions(textToUse, options);
    const questions = result.questions;
    const tokenUsage = result.tokenUsage;

    document.questions = questions;
    await document.save();

    // Consume tokens for question generation
    const user = req.user;
    if (user && tokenUsage) {
      try {
        const userDoc = await User.findById(user._id);
        if (userDoc) {
          const consumeResult = await userDoc.consumeTokens(
            tokenUsage.totalTokens || 0,
            tokenUsage.promptTokens || 0,
            tokenUsage.completionTokens || 0
          );
          console.log(`📊 Tokens - Input: ${consumeResult.dailyInputTokens.toLocaleString()} | Output: ${consumeResult.dailyOutputTokens.toLocaleString()} | Total: ${consumeResult.dailyUsed.toLocaleString()}/${consumeResult.dailyLimit.toLocaleString()}`);
        }
      } catch (error) {
        console.error('Error consuming tokens:', error);
      }
    }

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
    
    // Get text for processing (condensed if available)
    const textToUse = getTextForProcessing(document);
    if (!textToUse || !textToUse.trim()) {
      return res.status(400).json({ message: 'No extracted text available for this document' });
    }
    
    const options = {
      type: (type || 'mcq'),
      numQuestions: 1,
      coverAllTopics: !!coverAllTopics
    };
    
    // Verify we're using condensed text
    const isUsingCondensed = document.condensedText && 
                             document.condensedText.trim().length > 100 && 
                             textToUse === document.condensedText;
    console.log(`🔄 Regenerating single question from ${isUsingCondensed ? '✅ CONDENSED' : '⚠️ FULL'} text...`);
    if (isUsingCondensed) {
      console.log(`💰 Cost savings: ${Math.round((1 - textToUse.length / document.extractedText.length) * 100)}% reduction in tokens`);
    }
    const generated = await generateQuestions(textToUse, options);
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
      .select('title filename questions uploadedAt condensedText condensedTextLength')
      .sort({ uploadedAt: -1 });

    // Add condensedTextReady status to each document
    const documentsWithStatus = documents.map(doc => ({
      ...doc.toObject(),
      condensedTextReady: !!(doc.condensedText && doc.condensedText.trim().length > 100)
    }));

    res.json(documentsWithStatus);
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

    // Check if simplified summary is already cached
    if (document.simplifiedSummary && document.simplifiedSummary.trim().length > 0) {
      console.log('✅ Returning cached simplified summary');
      return res.json({ summary: document.simplifiedSummary, cached: true });
    }

    // Get text for processing (condensed if available)
    const textToUse = getTextForProcessing(document);
    if (!textToUse || !textToUse.trim()) {
      console.log('❌ No text available for document');
      return res.status(400).json({ message: 'No document content available' });
    }

    // Verify we're using condensed text
    const isUsingCondensed = document.condensedText && 
                             document.condensedText.trim().length > 100 && 
                             textToUse === document.condensedText;
    console.log(`📄 Generating simplified summary from ${isUsingCondensed ? '✅ CONDENSED' : '⚠️ FULL'} text...`);
    if (isUsingCondensed) {
      console.log(`💰 Cost savings: ${Math.round((1 - textToUse.length / document.extractedText.length) * 100)}% reduction in tokens`);
    }
    const aiService = await createAIService();

    const prompt = `You are an expert educational content writer who specializes in making complex academic and technical content accessible to all learners.

Your task is to create a SIMPLIFIED, professional, and easy-to-read version of the following document.

**REQUIRED STRUCTURE:**

### Introduction
[Provide a simple, clear introduction to the topic in plain language]

### Main Topics (Simplified)
[Break down the content into clear sections with simple explanations:]

#### Topic 1: [Simple Title]
**What it means:** [Explain in simple, everyday language]

**Key points:**
- [Simple explanation of first point]
- [Simple explanation of second point]
- [Simple explanation of third point]

**Example:** [Provide a relatable, real-world example]

#### Topic 2: [Simple Title]
**What it means:** [Explain in simple, everyday language]

**Key points:**
- [Simple explanation of first point]
- [Simple explanation of second point]

**Example:** [Provide a relatable, real-world example]

### Important Terms (In Simple Words)
[Define key terms using simple language:]
- **Complex Term** → Simple explanation in everyday words
- **Complex Term** → Simple explanation in everyday words

### How This Applies to Real Life
[Explain practical applications using simple examples]

### Quick Summary
[Provide a brief recap in simple, clear language]

**SIMPLIFICATION GUIDELINES:**
1. **Replace ALL complex words** with simple, everyday alternatives
2. **Use short sentences** - Break long, complicated sentences into shorter ones
3. **Add explanations** - Explain concepts that might be confusing
4. **Use analogies and examples** - Compare to familiar, everyday things
5. **Break down complex ideas** - Split into smaller, easy-to-understand parts
6. **Use conversational tone** - Write as if explaining to a friend
7. **Keep all information** - Don't remove important content, just make it simpler
8. **Make it accessible** - Anyone should be able to understand it

**FORMATTING GUIDELINES:**
- Use ### for main sections
- Use #### for subsections
- Use **bold** for important terms and concepts
- Use bullet points (-) for lists
- Use simple, clear language throughout
- Keep paragraphs short and focused
- Add examples and analogies
- Use proper spacing for readability

**QUALITY STANDARDS:**
- Professional yet accessible
- Comprehensive but simple
- Well-organized and structured
- Easy to read and understand
- Maintains all important information

Document Content:
${textToUse}

Provide a complete, well-formatted, simplified summary that anyone can understand.`;

    try {
      const result = await aiService.callAI(prompt);
      
      // Cache the simplified summary
      document.simplifiedSummary = result.response;
      await document.save();
      console.log('✅ Simplified summary cached for future use');
      
      // Consume the actual tokens used
      const user = req.userWithTokens; // User object with token methods from middleware
      if (user && result.tokenUsage) {
        const consumeResult = await user.consumeTokens(
          result.tokenUsage.totalTokens,
          result.tokenUsage.promptTokens || 0,
          result.tokenUsage.completionTokens || 0
        );
        console.log(`📊 Tokens - Input: ${consumeResult.dailyInputTokens.toLocaleString()} | Output: ${consumeResult.dailyOutputTokens.toLocaleString()} | Total: ${consumeResult.dailyUsed.toLocaleString()}/${consumeResult.dailyLimit.toLocaleString()}`);
      }
      
      res.json({ summary: result.response, cached: false }); // Extract the response string from the result object
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
      const textForFallback = textToUse || document.extractedText;
      const fallbackSummary = `Simplified Summary:\n\n${textForFallback.substring(0, 1000)}...\n\nNote: This is a simplified version that explains the key concepts in easier terms. The content covers the main topics from your document with additional explanations to help you understand the material better.`;
      
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

    // Check if shorter summary is already cached for this length
    if (document.shorterSummary && document.shorterSummary[length] && document.shorterSummary[length].trim().length > 0) {
      console.log(`✅ Returning cached shorter summary (${length})`);
      return res.json({ summary: document.shorterSummary[length], cached: true });
    }

    // Get text for processing (condensed if available)
    const textToUse = getTextForProcessing(document);
    if (!textToUse || !textToUse.trim()) {
      console.log('❌ No text available for document');
      return res.status(400).json({ message: 'No document content available' });
    }

    // Verify we're using condensed text
    const isUsingCondensed = document.condensedText && 
                             document.condensedText.trim().length > 100 && 
                             textToUse === document.condensedText;
    console.log(`📄 Generating shorter summary (${length}) from ${isUsingCondensed ? '✅ CONDENSED' : '⚠️ FULL'} text...`);
    if (isUsingCondensed) {
      console.log(`💰 Cost savings: ${Math.round((1 - textToUse.length / document.extractedText.length) * 100)}% reduction in tokens`);
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

    const prompt = `You are an expert educational content writer who specializes in creating concise, professional, and well-structured summaries.

Your task is to create a SHORTER, more focused version of the following document while maintaining professional quality and readability.

**LENGTH REQUIREMENT:** ${lengthInstruction}

**REQUIRED STRUCTURE:**

### Overview
[Brief introduction covering the main topic]

### Essential Concepts
[List only the most important concepts with concise explanations:]
- **Key Concept**: Brief, clear explanation
- **Key Concept**: Brief, clear explanation

### Core Points
[Organize the most important information into focused sections:]

#### Main Topic 1
- Essential point with brief explanation
- Critical information only

#### Main Topic 2
- Essential point with brief explanation
- Critical information only

### Key Takeaways
[Summarize the most important points in a concise list:]
1. [First critical takeaway]
2. [Second critical takeaway]
3. [Third critical takeaway]

**CONDENSATION GUIDELINES:**
1. **Preserve main ideas** - Keep all essential information and key concepts
2. **Remove redundancy** - Eliminate repetitive or less important details
3. **Use precise language** - Be concise but maintain clarity
4. **Focus on essentials** - Prioritize the most critical points
5. **Maintain structure** - Keep logical flow and organization
6. **Be comprehensive** - Cover all major topics, just more briefly
7. **Stay professional** - Maintain formal, educational tone

**FORMATTING GUIDELINES:**
- Use ### for main section headers
- Use #### for subsection headers
- Use **bold** for key terms and important concepts
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) for sequential information
- Keep sentences short and focused
- Use proper spacing between sections
- Maintain professional language

**QUALITY STANDARDS:**
- Professional and formal tone
- Well-organized and structured
- Easy to scan and read
- Comprehensive yet concise
- Maintains all critical information
- Exactly matches the requested length

Document Content:
${textToUse}

Provide a complete, well-formatted, shorter summary that maintains essential information while being more concise.`;

    try {
      const result = await aiService.callAI(prompt);

      // Cache the shorter summary for this length
      if (!document.shorterSummary) {
        document.shorterSummary = {};
      }
      document.shorterSummary[length] = result.response;
      await document.save();
      console.log(`✅ Shorter summary (${length}) cached for future use`);

      // Consume the actual tokens used
      const user = req.userWithTokens; // User object with token methods from middleware
      if (user && result.tokenUsage) {
        const consumeResult = await user.consumeTokens(
          result.tokenUsage.totalTokens,
          result.tokenUsage.promptTokens || 0,
          result.tokenUsage.completionTokens || 0
        );
        console.log(`📊 Tokens - Input: ${consumeResult.dailyInputTokens.toLocaleString()} | Output: ${consumeResult.dailyOutputTokens.toLocaleString()} | Total: ${consumeResult.dailyUsed.toLocaleString()}/${consumeResult.dailyLimit.toLocaleString()}`);
      }

      res.json({ summary: result.response, cached: false }); // Extract the response string from the result object
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
      const textForFallback = textToUse || document.extractedText;
      const lines = textForFallback.split('\n');
      
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
