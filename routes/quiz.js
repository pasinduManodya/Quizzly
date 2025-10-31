const express = require('express');
const mongoose = require('mongoose');
const Document = require('../models/Document');
const QuizResult = require('../models/QuizResult');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { createAIService } = require('../services/aiService');
const { asyncHandler, ValidationError, NotFoundError } = require('../middleware/errorHandler');

const router = express.Router();

// Enhanced explanation with configurable AI
async function enhanceExplanation(question, correctAnswer, userAnswer, originalExplanation) {
  try {
    const aiService = await createAIService();
    return await aiService.generateExplanation(question, correctAnswer, originalExplanation);
  } catch (error) {
    console.error('Error generating enhanced explanation:', error);
    return generateFallbackExplanation(question, correctAnswer, userAnswer, originalExplanation);
  }
}

// Fallback explanation generation when API quota is exceeded
function generateFallbackExplanation(question, correctAnswer, userAnswer, originalExplanation) {
  console.log('🔄 Generating fallback explanation...');
  
  let enhancedExplanation = `## Enhanced Explanation\n\n`;
  enhancedExplanation += `> **Note**: This explanation was generated using fallback methods due to AI service limitations. For more detailed explanations, consider checking your AI configuration.\n\n`;
  
  enhancedExplanation += `### Question Analysis\n\n`;
  enhancedExplanation += `**Question**: ${question}\n\n`;
  enhancedExplanation += `**Correct Answer**: ${correctAnswer}\n\n`;
  enhancedExplanation += `**Your Answer**: ${userAnswer}\n\n`;
  
  enhancedExplanation += `### Explanation\n\n`;
  enhancedExplanation += `${originalExplanation}\n\n`;
  
  enhancedExplanation += `### Key Learning Points\n\n`;
  enhancedExplanation += `- Review the original explanation carefully\n`;
  enhancedExplanation += `- Understand why the correct answer is right\n`;
  enhancedExplanation += `- Consider why other options might be wrong\n`;
  enhancedExplanation += `- Practice similar questions to reinforce learning\n\n`;
  
  enhancedExplanation += `### Study Tips\n\n`;
  enhancedExplanation += `1. **Read thoroughly** - Make sure you understand all concepts\n`;
  enhancedExplanation += `2. **Practice regularly** - Take more quizzes to test your knowledge\n`;
  enhancedExplanation += `3. **Review explanations** - Don't just check if you're right or wrong\n`;
  enhancedExplanation += `4. **Ask questions** - If something isn't clear, seek clarification\n\n`;
  
  enhancedExplanation += `### Upgrade Recommendation\n\n`;
  enhancedExplanation += `Consider upgrading your API plan to get:\n`;
  enhancedExplanation += `- More detailed AI-generated explanations\n`;
  enhancedExplanation += `- Enhanced question generation\n`;
  enhancedExplanation += `- Better study material summaries\n`;
  enhancedExplanation += `- Advanced learning features\n`;
  
  console.log('✅ Generated fallback explanation');
  return enhancedExplanation;
}

function normalizeAnswer(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9\s]/g, '');
}

function mapLetterToOption(letter, options) {
  if (!options || !Array.isArray(options)) return null;
  const idxMap = { a: 0, b: 1, c: 2, d: 3 };
  const key = String(letter || '').trim().toLowerCase().replace(/option\s+/,'');
  const idx = idxMap[key] !== undefined ? idxMap[key] : null;
  if (idx === null) return null;
  return options[idx] ?? null;
}

function isAnswerCorrect(question, userAnswerRaw) {
  const userAnswer = (userAnswerRaw || '').toString().trim();
  const correct = (question.correctAnswer || '').toString().trim();

  console.log('🔍 SIMPLE CHECK:');
  console.log('User Answer:', JSON.stringify(userAnswer));
  console.log('Correct Answer:', JSON.stringify(correct));
  console.log('Question Type:', question.type);

  // If user didn't answer, it's wrong
  if (!userAnswer) {
    console.log('❌ No user answer');
    return false;
  }

  // SUPER SIMPLE: Just check if they match (case insensitive)
  const userLower = userAnswer.toLowerCase().trim();
  const correctLower = correct.toLowerCase().trim();
  
  console.log('User (lower):', JSON.stringify(userLower));
  console.log('Correct (lower):', JSON.stringify(correctLower));
  
  if (userLower === correctLower) {
    console.log('✅ EXACT MATCH!');
    return true;
  }

  // For MCQ - check if user selected the correct option text
  if (question.type === 'mcq' && Array.isArray(question.options)) {
    console.log('📝 MCQ - Options:', question.options);
    
    // Find which option matches the correct answer
    const correctOption = question.options.find(option => 
      option.toLowerCase().trim() === correctLower
    );
    
    if (correctOption) {
      console.log('🎯 Correct option found:', correctOption);
      
      // Check if user selected this correct option
      if (userLower === correctOption.toLowerCase().trim()) {
        console.log('✅ USER SELECTED CORRECT OPTION!');
        return true;
      }
    }
    
    // Also check by letter (A, B, C, D)
    const letterMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
    const userLetter = userLower.charAt(0);
    
    if (letterMap[userLetter] !== undefined) {
      const userOptionIndex = letterMap[userLetter];
      console.log('🔤 User selected letter:', userLetter, 'index:', userOptionIndex);
      
      if (userOptionIndex < question.options.length) {
        const userSelectedOption = question.options[userOptionIndex];
        console.log('📋 User selected option:', userSelectedOption);
        
        if (userSelectedOption.toLowerCase().trim() === correctLower) {
          console.log('✅ USER SELECTED CORRECT OPTION BY LETTER!');
          return true;
        }
      }
    }
    
    // Check if correct answer is a letter and user selected the corresponding option text
    const correctLetter = correctLower.charAt(0);
    if (letterMap[correctLetter] !== undefined) {
      const correctOptionIndex = letterMap[correctLetter];
      console.log('🎯 Correct answer is letter:', correctLetter, 'index:', correctOptionIndex);
      
      if (correctOptionIndex < question.options.length) {
        const correctOptionText = question.options[correctOptionIndex];
        console.log('📋 Correct option text:', correctOptionText);
        
        if (userLower === correctOptionText.toLowerCase().trim()) {
          console.log('✅ USER SELECTED CORRECT OPTION TEXT FOR LETTER-BASED ANSWER!');
          return true;
        }
      }
    }
  }

  console.log('❌ NO MATCH');
  return false;
}

// Enhanced essay grading using AI with explicit point identification
async function gradeEssayAnswer(correctAnswer, userAnswer) {
  try {
    const aiService = await createAIService();
    const prompt = `You are grading a student's essay answer using a detailed point-based system.

STEP 1: ANALYZE THE CORRECT ANSWER
- Read the correct answer carefully
- Identify ALL important points, concepts, facts, explanations, or arguments
- List every single point that should be covered
- Be thorough - don't miss any important details

STEP 2: ANALYZE THE STUDENT'S ANSWER
- Read the student's answer carefully
- Check which of the identified points the student covered
- Note what the student said about each point (if anything)
- Identify which points the student completely missed

STEP 3: CALCULATE THE SCORE
- Count total points identified from correct answer
- Count points the student covered correctly (only mark as covered if student actually addressed that specific point)
- Calculate: (points covered) / (total points) * 100
- IMPORTANT: Be very strict about what counts as "covered" - the student must actually address the specific point

STEP 4: ASSIGN GRADE BASED ON SCORE
- 90-100%: Excellent
- 80-89%: Good  
- 70-79%: Satisfactory
- 60-69%: Needs Improvement
- Below 60%: Poor

CRITICAL: Double-check your counting! If student missed 2 out of 5 points, the score should be 3/5 = 60%, not 5/5 = 100%

IMPORTANT: Be explicit about the grading process. Show ALL points you identified, not just the ones the student covered.

Return STRICT JSON in this schema and NOTHING else:
{
  "totalPoints": number,
  "pointsCovered": number,
  "score": number,
  "grade": "Excellent" | "Good" | "Satisfactory" | "Needs Improvement" | "Poor",
  "allCorrectPoints": [
    {
      "pointNumber": number,
      "point": "description of the key point",
      "covered": true/false,
      "studentMention": "what student said about this point (if covered, otherwise empty string)"
    }
  ],
  "missedPoints": [
    "list of points the student completely missed"
  ],
  "feedback": "Overall feedback explaining the grading process and score",
  "strengths": "What the student did well",
  "improvements": "What the student should improve"
}

GRADING SCALE:
- 90-100%: Excellent
- 80-89%: Good  
- 70-79%: Satisfactory
- 60-69%: Needs Improvement
- Below 60%: Poor

EXAMPLE OUTPUT:
If correct answer has 5 points and student covers 3:
- totalPoints: 5
- pointsCovered: 3
- score: 60
- grade: "Needs Improvement"
- allCorrectPoints: [list all 5 points with covered status - exactly 3 should be marked as covered=true]
- missedPoints: [list the 2 missed points]

VERIFICATION CHECKLIST:
1. Count how many points you marked as "covered: true" in allCorrectPoints
2. This count MUST equal the pointsCovered number
3. The score MUST equal (pointsCovered / totalPoints) * 100
4. The grade MUST match the score percentage

Correct Answer:\n${correctAnswer}\n\nStudent Answer:\n${userAnswer}`;

    const result = await aiService.callAI(prompt);
    const text = result.response;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate the response
    if (!parsed.totalPoints || !parsed.pointsCovered || !parsed.score || !parsed.allCorrectPoints) {
      throw new Error('Invalid grading response from AI');
    }
    
    // Double-check the AI's counting logic
    const actualCoveredPoints = parsed.allCorrectPoints.filter(point => point.covered === true).length;
    if (actualCoveredPoints !== parsed.pointsCovered) {
      console.warn(`AI counting error: Reported ${parsed.pointsCovered} covered points, but actual count is ${actualCoveredPoints}`);
      parsed.pointsCovered = actualCoveredPoints;
      parsed.score = Math.round((actualCoveredPoints / parsed.totalPoints) * 100);
    }
    
    // Ensure score is within valid range and recalculate if needed
    parsed.score = Math.max(0, Math.min(100, parsed.score));
    
    // Recalculate grade based on corrected score
    if (parsed.score >= 90) {
      parsed.grade = 'Excellent';
    } else if (parsed.score >= 80) {
      parsed.grade = 'Good';
    } else if (parsed.score >= 70) {
      parsed.grade = 'Satisfactory';
    } else if (parsed.score >= 60) {
      parsed.grade = 'Needs Improvement';
    } else {
      parsed.grade = 'Poor';
    }
    
    return parsed;
  } catch (error) {
    console.error('Essay grading error:', error);
    
    // Check if it's a quota exceeded error
    if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests'))) {
      console.log('⚠️ AI service quota exceeded. Using fallback grading.');
      return {
        totalPoints: 1,
        pointsCovered: 0,
        score: 0,
        grade: 'Poor',
        allCorrectPoints: [{
          pointNumber: 1,
          point: 'API quota exceeded - unable to grade',
          covered: false,
          studentMention: ''
        }],
        missedPoints: ['API quota exceeded - unable to grade'],
        feedback: 'AI grading is currently unavailable due to API quota limits. Please try again later or contact support.',
        strengths: 'Unable to evaluate due to API limitations.',
        improvements: 'Please try again later when API quota is available.'
      };
    }
    
    // Check if it's a service unavailable error (503)
    if (error.message && (error.message.includes('503') || error.message.includes('Service Unavailable') || error.message.includes('ENOTFOUND'))) {
      console.log('⚠️ AI service temporarily unavailable. Using fallback grading.');
      return {
        totalPoints: 1,
        pointsCovered: 0,
        score: 0,
        grade: 'Poor',
        allCorrectPoints: [{
          pointNumber: 1,
          point: 'AI service temporarily unavailable - unable to grade',
          covered: false,
          studentMention: ''
        }],
        missedPoints: ['AI service temporarily unavailable - unable to grade'],
        feedback: 'AI grading is temporarily unavailable due to service issues. Please try again in a few minutes.',
        strengths: 'Unable to evaluate due to temporary service issues.',
        improvements: 'Please try again in a few minutes when the AI service is back online.'
      };
    }
    
    // Check if it's a database connection error
    if (error.message && (error.message.includes('buffering') || error.message.includes('ENOTFOUND') || error.message.includes('Database connection'))) {
      console.log('⚠️ Database connection issue. Using fallback grading.');
      return {
        totalPoints: 1,
        pointsCovered: 0,
        score: 0,
        grade: 'Poor',
        allCorrectPoints: [{
          pointNumber: 1,
          point: 'Database connection issue - unable to grade',
          covered: false,
          studentMention: ''
        }],
        missedPoints: ['Database connection issue - unable to grade'],
        feedback: 'AI grading is temporarily unavailable due to database connection issues. Please try again in a few minutes.',
        strengths: 'Unable to evaluate due to database connection issues.',
        improvements: 'Please try again in a few minutes when the database connection is restored.'
      };
    }
    
    // Check if it's an AI configuration error
    if (error.message && error.message.includes('No active AI configuration')) {
      console.log('⚠️ No AI configuration found. Using fallback grading.');
      return {
        totalPoints: 1,
        pointsCovered: 0,
        score: 0,
        grade: 'Poor',
        allCorrectPoints: [{
          pointNumber: 1,
          point: 'AI service not configured - unable to grade',
          covered: false,
          studentMention: ''
        }],
        missedPoints: ['AI service not configured - unable to grade'],
        feedback: 'AI grading is currently unavailable. Please configure an AI service in the admin panel.',
        strengths: 'Unable to evaluate due to missing AI configuration.',
        improvements: 'Please contact the administrator to configure AI services.'
      };
    }
    
    // For other errors, return a basic fallback with more specific error info
    console.error('❌ Unexpected essay grading error:', error.message);
    return {
      totalPoints: 1,
      pointsCovered: 0,
      score: 0,
      grade: 'Poor',
      allCorrectPoints: [{
        pointNumber: 1,
        point: `Error: ${error.message}`,
        covered: false,
        studentMention: ''
      }],
      missedPoints: [`Error: ${error.message}`],
      feedback: `AI grading encountered an error: ${error.message}. Please try again or contact support if this persists.`,
      strengths: 'Unable to evaluate due to technical error.',
      improvements: 'Please try again or contact support if this persists.'
    };
  }
}

// Endpoint to grade an essay answer
router.post('/grade-essay', auth, asyncHandler(async (req, res) => {
  const { correctAnswer, userAnswer } = req.body;
  if (!correctAnswer || !userAnswer) {
    throw new ValidationError('Missing required fields: correctAnswer and userAnswer');
  }
  const grading = await gradeEssayAnswer(correctAnswer, userAnswer);
  res.json(grading);
}));

// Test endpoint to debug quiz submission
router.post('/test-submit', auth, asyncHandler(async (req, res) => {
  console.log('\n🧪 === TEST QUIZ SUBMIT ===');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  console.log('User:', req.user);
  
  const { documentId, answers } = req.body;
  
  console.log('documentId:', documentId, '(type:', typeof documentId, ')');
  console.log('answers:', answers, '(type:', typeof answers, ')');
  console.log('answers length:', answers ? answers.length : 'undefined');
  
  // Simple validation
  if (!documentId) {
    throw new ValidationError('Document ID is required');
  }
  
  if (!answers || !Array.isArray(answers)) {
    throw new ValidationError('Answers must be an array');
  }
  
  res.json({ 
    message: 'Test successful',
    documentId,
    answersCount: answers.length,
    user: req.user.email
  });
}));

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!', 
    timestamp: new Date().toISOString(),
    version: 'PROPER QUIZ EVALUATOR - ACCURATE SCORING'
  });
});

// Quiz Evaluator Function - FIXED VERSION
function evaluateQuiz(questions, userAnswers) {
  console.log('🔍 === QUIZ EVALUATOR STARTED ===');
  console.log('Questions:', questions.length);
  console.log('User Answers:', userAnswers);
  
  let correct = 0;
  let incorrect = 0;
  const results = [];
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const userAnswer = (userAnswers[i] || '').toString().trim();
    const correctAnswer = (question.correctAnswer || '').toString().trim();
    
    console.log(`\n--- Question ${i + 1} ---`);
    console.log('Question:', question.question);
    console.log('User Answer (raw):', JSON.stringify(userAnswer));
    console.log('Correct Answer (raw):', JSON.stringify(correctAnswer));
    console.log('Question Type:', question.type);
    console.log('Options:', question.options);
    console.log('Question Object Keys:', Object.keys(question));
    console.log('Correct Answer Type:', typeof correctAnswer);
    console.log('User Answer Type:', typeof userAnswer);
    
    // Use the comprehensive isAnswerCorrect function
    const isCorrect = isAnswerCorrect(question, userAnswer);
    
    if (isCorrect) {
      correct++;
      console.log('✅ CORRECT');
    } else {
      incorrect++;
      console.log('❌ INCORRECT');
    }
    
    results.push({
      questionId: new mongoose.Types.ObjectId(),
      userAnswer: userAnswers[i] || '',
      isCorrect: isCorrect,
      question: question.question || '',
      correctAnswer: question.correctAnswer || '',
      explanation: question.explanation || '',
      options: question.options || [],
      type: question.type || 'mcq',
      essayGrading: null,
      questionScore: isCorrect ? 1 : 0,
      maxQuestionScore: 1
    });
  }
  
  const totalQuestions = questions.length;
  const percentage = Math.round((correct / totalQuestions) * 100);
  
  console.log('🏆 === EVALUATION COMPLETE ===');
  console.log('Total Questions:', totalQuestions);
  console.log('Correct:', correct);
  console.log('Incorrect:', incorrect);
  console.log('Percentage:', percentage + '%');
  
  return {
    totalQuestions,
    correct,
    incorrect,
    percentage,
    results
  };
}

// Submit quiz answers - PROPER EVALUATOR VERSION
router.post('/submit', auth, asyncHandler(async (req, res) => {
    console.log('\n🚀 === QUIZ SUBMIT WITH PROPER EVALUATOR ===');
    console.log('📝 Request body:', req.body);
    
    const { documentId, answers } = req.body;
    
    // Basic validation
    if (!documentId || !answers || !Array.isArray(answers)) {
      console.log('❌ Validation failed:', { documentId, answers });
      throw new ValidationError('Missing required data: documentId and answers array');
    }
    
    console.log('✅ Validation passed');
    console.log('📋 Document ID:', documentId);
    console.log('📋 User Answers:', answers);
    
    // Get the document
    const document = await Document.findOne({
      _id: documentId,
      user: req.user._id
    });

    if (!document) {
      console.log('❌ Document not found');
      throw new NotFoundError('Document');
    }

    console.log('✅ Document found:', document.title);
    console.log('📋 Document Questions:', document.questions);

    // Use the proper quiz evaluator
    const evaluation = evaluateQuiz(document.questions, answers);
    
    console.log('📊 EVALUATION RESULT:', evaluation);

    // Create quiz result
    const quizResultData = {
      document: new mongoose.Types.ObjectId(documentId),
      user: new mongoose.Types.ObjectId(req.user._id),
      answers: evaluation.results,
      score: evaluation.correct,
      totalQuestions: evaluation.totalQuestions,
      totalScore: evaluation.correct,
      maxPossibleScore: evaluation.totalQuestions
    };
    
    const quizResult = new QuizResult(quizResultData);
    
    // Save without validation
    await quizResult.save({ validateBeforeSave: false });

    console.log('✅ Quiz result saved with proper evaluation!');

    // Update user's quiz count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalQuizzesTaken: 1 }
    });

    console.log('✅ User quiz count updated!');

    res.json({
      score: evaluation.correct,
      totalQuestions: evaluation.totalQuestions,
      percentage: evaluation.percentage,
      results: evaluation.results,
      quizResultId: quizResult._id,
      totalScore: evaluation.correct,
      maxPossibleScore: evaluation.totalQuestions,
      correct: evaluation.correct,
      incorrect: evaluation.incorrect,
      answers: evaluation.results // Make sure answers array is included
    });
}));

// Save quiz result for revision
router.post('/save/:quizResultId', auth, asyncHandler(async (req, res) => {
    console.log('🔄 Saving quiz to revision history...');
    
    const quizResult = await QuizResult.findOneAndUpdate(
      {
        _id: req.params.quizResultId,
        user: req.user._id
      },
      {
        savedForRevision: true
      },
      { new: true }
    );

    if (!quizResult) {
      console.log('❌ Quiz result not found');
      throw new NotFoundError('Quiz result');
    }

    console.log('✅ Quiz marked as saved for revision');

    // Auto-cleanup: Keep only 20 most recent papers
    const savedQuizzes = await QuizResult.find({ 
      user: req.user._id,
      savedForRevision: true 
    }).sort({ completedAt: -1 });

    console.log(`📊 Found ${savedQuizzes.length} saved quizzes`);

    if (savedQuizzes.length > 20) {
      const quizzesToDelete = savedQuizzes.slice(20); // Get quizzes beyond the 20 most recent
      const deleteIds = quizzesToDelete.map(quiz => quiz._id);
      
      console.log(`🗑️ Removing ${quizzesToDelete.length} oldest quizzes from revision history`);
      console.log(`📋 Quizzes to remove:`, deleteIds);
      
      // Remove from revision history by setting savedForRevision to false
      const deleteResult = await QuizResult.updateMany(
        { _id: { $in: deleteIds } },
        { savedForRevision: false }
      );
      
      console.log(`✅ Removed ${deleteResult.modifiedCount} old quizzes from revision history`);
    }

    res.json({ 
      message: 'Quiz result saved for revision', 
      saved: true,
      totalSaved: Math.min(savedQuizzes.length, 20)
    });
}));

// Get user's quiz history
router.get('/history', auth, asyncHandler(async (req, res) => {
  console.log('📚 BACKEND: Getting quiz history for user:', req.user._id);
  
  const quizResults = await QuizResult.find({ user: req.user._id })
    .populate('document', 'title')
    .sort({ completedAt: -1 })
    .limit(50); // Limit to last 50 quizzes

  console.log('📚 BACKEND: Found', quizResults.length, 'quiz results');
  console.log('📚 BACKEND: Quiz IDs:', quizResults.map(q => q._id));

  res.json(quizResults);
}));

// Get specific quiz result
router.get('/result/:quizResultId', auth, asyncHandler(async (req, res) => {
  const quizResult = await QuizResult.findOne({
    _id: req.params.quizResultId,
    user: req.user._id
  }).populate('document');

  if (!quizResult) {
    throw new NotFoundError('Quiz result');
  }

  res.json(quizResult);
}));

// Get enhanced explanation for a specific question
router.post('/explanation', auth, asyncHandler(async (req, res) => {
  const { question, correctAnswer, userAnswer, originalExplanation } = req.body;
  
  if (!question || !correctAnswer || !originalExplanation) {
    throw new ValidationError('Missing required fields: question, correctAnswer, and originalExplanation');
  }

  const enhancedExplanation = await enhanceExplanation(
    question, 
    correctAnswer, 
    userAnswer || '', 
    originalExplanation
  );

  res.json({ 
    enhancedExplanation,
    originalExplanation 
  });
}));

// Manual cleanup endpoint to remove old revisions
router.post('/cleanup-revisions', auth, asyncHandler(async (req, res) => {
  console.log('🧹 Starting manual cleanup of revision history...');
  
  const savedQuizzes = await QuizResult.find({ 
    user: req.user._id,
    savedForRevision: true 
  }).sort({ completedAt: -1 });

  console.log(`📊 Found ${savedQuizzes.length} saved quizzes`);

  if (savedQuizzes.length > 20) {
    const quizzesToDelete = savedQuizzes.slice(20); // Get quizzes beyond the 20 most recent
    const deleteIds = quizzesToDelete.map(quiz => quiz._id);
    
    console.log(`🗑️ Removing ${quizzesToDelete.length} oldest quizzes from revision history`);
    
    const deleteResult = await QuizResult.updateMany(
      { _id: { $in: deleteIds } },
      { savedForRevision: false }
    );
    
    console.log(`✅ Removed ${deleteResult.modifiedCount} old quizzes from revision history`);
    
    res.json({ 
      message: `Cleaned up ${deleteResult.modifiedCount} old revisions`,
      removed: deleteResult.modifiedCount,
      remaining: 20
    });
  } else {
    console.log('✅ No cleanup needed - under 20 revisions');
    res.json({ 
      message: 'No cleanup needed',
      remaining: savedQuizzes.length
    });
  }
}));

// Delete individual revision
router.delete('/delete-revision/:quizResultId', auth, asyncHandler(async (req, res) => {
  console.log('🗑️ Deleting revision:', req.params.quizResultId);
  
  const result = await QuizResult.findOneAndUpdate(
    {
      _id: req.params.quizResultId,
      user: req.user._id,
      savedForRevision: true
    },
    {
      savedForRevision: false
    }
  );

  if (!result) {
    console.log('❌ Revision not found or already deleted');
    throw new NotFoundError('Revision');
  }

  console.log('✅ Revision deleted successfully');
  res.json({ message: 'Revision deleted successfully' });
}));

// Delete any quiz result (not just saved revisions)
router.delete('/delete/:quizResultId', auth, asyncHandler(async (req, res) => {
  console.log('🗑️ BACKEND: Deleting quiz result:', req.params.quizResultId);
  console.log('🗑️ BACKEND: User ID:', req.user._id);
  
  // First, let's check if the quiz exists
  const existingQuiz = await QuizResult.findOne({
    _id: req.params.quizResultId,
    user: req.user._id
  });
  
  console.log('🔍 BACKEND: Existing quiz found:', existingQuiz ? 'YES' : 'NO');
  if (existingQuiz) {
    console.log('🔍 BACKEND: Quiz details:', {
      _id: existingQuiz._id,
      document: existingQuiz.document,
      score: existingQuiz.score,
      totalQuestions: existingQuiz.totalQuestions
    });
  }
  
  const result = await QuizResult.findOneAndDelete({
    _id: req.params.quizResultId,
    user: req.user._id
  });

  console.log('🗑️ BACKEND: Delete result:', result ? 'SUCCESS' : 'NOT FOUND');
  if (result) {
    console.log('🗑️ BACKEND: Deleted quiz ID:', result._id);
  }

  if (!result) {
    console.log('❌ BACKEND: Quiz result not found');
    throw new NotFoundError('Quiz result');
  }

  console.log('✅ BACKEND: Quiz result deleted successfully');
  
  // Let's verify the deletion by checking if the quiz still exists
  const verifyDeletion = await QuizResult.findOne({
    _id: req.params.quizResultId,
    user: req.user._id
  });
  
  console.log('🔍 BACKEND: Verification - Quiz still exists after deletion:', verifyDeletion ? 'YES' : 'NO');
  
  res.json({ message: 'Quiz result deleted successfully' });
}));

// Get saved quizzes for revision
router.get('/revision', auth, asyncHandler(async (req, res) => {
  console.log('📚 Getting revision data...');
  
  const quizResults = await QuizResult.find({ 
    user: req.user._id,
    savedForRevision: true 
  })
    .populate('document', 'title')
    .sort({ completedAt: -1 });

  console.log(`Found ${quizResults.length} saved quizzes for revision`);

  // Collect all questions from saved quizzes
  const revisionData = [];
  quizResults.forEach(quizResult => {
    quizResult.answers.forEach(answer => {
      revisionData.push({
        quizResultId: quizResult._id,
        documentTitle: quizResult.document.title,
        question: answer.question,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        explanation: answer.explanation,
        isCorrect: answer.isCorrect,
        questionScore: answer.questionScore,
        maxQuestionScore: answer.maxQuestionScore,
        completedAt: quizResult.completedAt,
        totalScore: quizResult.totalScore,
        maxPossibleScore: quizResult.maxPossibleScore
      });
    });
  });

  console.log(`Returning ${revisionData.length} questions for revision`);
  res.json(revisionData);
}));

module.exports = router;
