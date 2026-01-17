import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, quizAPI, favoritesAPI } from '../services/api';
import axios from 'axios';
import ExplanationModal from '../components/ExplanationModal';
import Stopwatch from '../components/Stopwatch';
import LoadingSpinner from '../components/LoadingSpinner';
import AILoading from '../components/AILoading';
import { generateQuizPDF } from '../utils/pdfGenerator';

interface Question {
  _id: string;
  type: 'mcq' | 'short' | 'essay' | 'structured_essay';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

interface Document {
  _id: string;
  title: string;
  questions: Question[];
}

const Quiz: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [favorited, setFavorited] = useState<Record<number, boolean>>({});
  const [favoritePending, setFavoritePending] = useState<Record<number, boolean>>({});
  const [favoriteError, setFavoriteError] = useState<Record<number, string | undefined>>({});
  const [quizDuration, setQuizDuration] = useState(0);
  const [essayEval, setEssayEval] = useState<Record<number, { 
    totalPoints: number;
    pointsCovered: number;
    score: number;
    grade: string;
    allCorrectPoints: Array<{
      pointNumber: number;
      point: string;
      covered: boolean;
      studentMention: string;
    }>;
    missedPoints: string[];
    feedback: string;
    strengths: string;
    improvements: string;
  } | null>>({});
  
  // Real-time tracking variables
  const [total, setTotal] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [essayEvalLoading, setEssayEvalLoading] = useState<Record<number, boolean>>({});
  const [essayEvalError, setEssayEvalError] = useState<Record<number, string | undefined>>({});
  const [regeneratingQuestion, setRegeneratingQuestion] = useState<Record<number, boolean>>({});
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await documentsAPI.getById(documentId!);
      setDocument(response.data);
      setAnswers(new Array(response.data.questions.length).fill(''));
      
      // Reset real-time tracking variables
      setTotal(response.data.questions.length);
      setCorrect(0);
      setIncorrect(0);
    } catch (error) {
      console.error('Error fetching document:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
    
    // Mark this question as answered
    setAnsweredQuestions(prev => new Set([...Array.from(prev), questionIndex]));
    
    // Real-time evaluation - check if answer is correct
    if (document && document.questions[questionIndex]) {
      const question = document.questions[questionIndex];
      const userAnswer = answer.toString().trim().toUpperCase();
      const correctAnswer = question.correctAnswer.toString().trim().toUpperCase();
      const isCorrect = userAnswer === correctAnswer;
      
      // Update real-time tracking variables with simple counting
      setTotal(document.questions.length);
      
      // Count correct and incorrect answers from all current answers
      let correctCount = 0;
      let incorrectCount = 0;
      
      // Use the updated answers array (with the new answer)
      const updatedAnswers = [...answers];
      updatedAnswers[questionIndex] = answer;
      
      document.questions.forEach((q, index) => {
        const currentAnswer = (updatedAnswers[index] || '').toString().trim().toUpperCase();
        const currentCorrectAnswer = q.correctAnswer.toString().trim().toUpperCase();
        
        if (currentAnswer !== '') {
          if (currentAnswer === currentCorrectAnswer) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      });
      
      setCorrect(correctCount);
      setIncorrect(incorrectCount);
      
      // Immediate console output
      console.log(`Question ${questionIndex + 1}: ${isCorrect ? 'correct' : 'wrong'}`);
      console.log(`Total: ${document.questions.length}, Correct: ${correctCount}, Incorrect: ${incorrectCount}`);
    }
  };

  const handleViewExplanation = (questionIndex: number) => {
    setSelectedQuestionIndex(questionIndex);
    setShowExplanation(true);
  };

  const handleDownloadPDF = () => {
    if (!document) return;
    
    const quizResult = {
      document,
      answers,
      total,
      correct,
      incorrect,
      quizDuration
    };
    
    generateQuizPDF(quizResult);
  };

  const formatQuestionText = (questionText: string) => {
    // Check if this is a structured essay question with parts (a), (b), (c), etc.
    // Match parts whether they're on new lines or inline
    const partPattern = /[a-z]\)\s+/gi;
    const partMatches = questionText.match(partPattern);
    const hasMultipleParts = partMatches && partMatches.length >= 2;
    
    if (hasMultipleParts) {
      // Split by part pattern (both newline and inline)
      const parts = questionText.split(/(?=[a-z]\)\s+)/i).filter(part => part.trim());
      
      return (
        <div className="space-y-4">
          {parts.map((part, index) => {
            const trimmedPart = part.trim();
            
            if (!trimmedPart) return null;
            
            // Check if this part starts with a letter and parenthesis
            const isSubPart = /^[a-z]\)\s+/i.test(trimmedPart);
            
            return (
              <div key={index}>
                {!isSubPart ? (
                  // Main question (intro text before first part)
                  <p className="text-lg font-semibold text-gray-900 leading-relaxed mb-4">{trimmedPart}</p>
                ) : (
                  // Sub-parts with consistent formatting - maintain a), b), c) structure
                  <div className="ml-4 pl-4 border-l-3 border-blue-400 bg-blue-50 py-3 px-4 rounded-r">
                    <p className="text-base font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{trimmedPart}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }
    
    // Regular question formatting - show full text without truncation
    return <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">{questionText}</p>;
  };

  const handleSubmitQuiz = async () => {
    if (!document) return;
    
    // Check if this quiz has only MCQ questions
    const hasOnlyMCQ = document.questions.every(q => q.type === 'mcq');
    
    // Only show popup for MCQ quizzes
    if (hasOnlyMCQ) {
      setShowResultsPopup(true);
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Ensure we have answers for all questions (fill empty ones with empty strings)
      const allAnswers = document.questions.map((_, index) => answers[index] || '');
      
      // Submit quiz answers
      const response = await quizAPI.submit(document._id, allAnswers);
      const { quizResultId, totalQuestions, correct, incorrect } = response.data;
      
      // Use EXACT numbers from backend evaluation
      const exactTotal = totalQuestions;
      const exactCorrect = correct;
      const exactIncorrect = incorrect;
      
      // Update state with exact backend values
      setTotal(exactTotal);
      setCorrect(exactCorrect);
      setIncorrect(exactIncorrect);
      
      // Display final values in console after submission
      console.log('🎯 FINAL QUIZ RESULTS (FROM BACKEND):');
      console.log(`Total: ${exactTotal}`);
      console.log(`Correct: ${exactCorrect}`);
      console.log(`Incorrect: ${exactIncorrect}`);
      console.log('📊 Backend Response:', response.data);
      
      // Save to revision history immediately
      try {
        console.log('🔄 Attempting to save quiz to revision history...');
        const saveResponse = await quizAPI.save(quizResultId);
        console.log('✅ Quiz paper saved to revision history immediately');
        console.log('📄 Complete paper saved with all questions and answers');
        console.log('💾 Save response:', saveResponse.data);
        
        // Show success notification
        setShowSaveNotification(true);
        setTimeout(() => setShowSaveNotification(false), 4000); // Hide after 4 seconds
        
        // Auto-cleanup after saving
        try {
          console.log('🧹 Starting auto-cleanup of old revisions...');
          await fetch('/api/quiz/cleanup-revisions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          console.log('✅ Auto-cleanup completed');
        } catch (cleanupError) {
          console.log('⚠️ Auto-cleanup failed, but quiz was saved:', cleanupError);
        }
      } catch (error: any) {
        console.error('❌ Error saving to revision history:', error);
        console.error('❌ Save error details:', error.response?.data || error.message);
      }
      
      // Don't navigate to result sheet - just show popup
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setError(error?.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const answeredCount = answeredQuestions.size;
  const allQuestionsAnswered = document ? answers.every(answer => answer && answer.trim() !== '') : false;
  const hasAnyAnswers = document ? answers.some(answer => answer && answer.trim() !== '') : false;
  const progress = (answeredCount / document.questions.length) * 100;

  // Helpers to evaluate correctness consistently with backend
  const normalizeAnswer = (text: string) =>
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s]/g, '');

  const mapLetterToOption = (letterOrText: string, options?: string[]) => {
    if (!options || !Array.isArray(options)) return null;
    const key = String(letterOrText || '')
      .trim()
      .toLowerCase()
      .replace(/option\s+/, '');
    const idxMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
    const idx = idxMap[key];
    if (idx === undefined) return null;
    return options[idx] ?? null;
  };

  const isAnswerCorrect = (question: Question, userAnswerRaw: string) => {
    const userAnswer = String(userAnswerRaw || '');
    const correct = String(question.correctAnswer || '');

    // Exact normalized match
    if (normalizeAnswer(userAnswer) === normalizeAnswer(correct)) return true;

    // MCQ: accept letters A/B/C/D mapping to options
    if (question.type === 'mcq' && Array.isArray(question.options)) {
      const mappedFromCorrect = mapLetterToOption(correct, question.options);
      if (mappedFromCorrect && normalizeAnswer(userAnswer) === normalizeAnswer(mappedFromCorrect)) return true;

      const mappedFromUser = mapLetterToOption(userAnswer, question.options);
      if (mappedFromUser && normalizeAnswer(mappedFromUser) === normalizeAnswer(correct)) return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 sm:py-4 lg:py-6 gap-3 sm:gap-4">
            {/* Title Section */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{document.title}</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                Answered {answeredCount} of {document.questions.length} questions
              </p>
            </div>
            
            {/* Timer and Button Section - Side by side on all screens */}
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 flex-shrink-0">
              {/* Timer */}
              <Stopwatch 
                onTimeUpdate={setQuizDuration}
              />
              
              {/* Back Button */}
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center justify-center space-x-1.5 sm:space-x-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Progress Bar */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* All Questions */}
        <div className="space-y-6">
          {document.questions.map((question, questionIndex) => (
            <div key={question._id} className="card">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Question {questionIndex + 1}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                      title={favorited[questionIndex] ? 'Unfavorite' : 'Favorite'}
                      onClick={async () => {
                        if (favoritePending[questionIndex]) return;
                        try {
                          setFavoritePending(prev => ({ ...prev, [questionIndex]: true }));
                          setFavoriteError(prev => ({ ...prev, [questionIndex]: undefined }));
                          const res = await favoritesAPI.toggle({
                            question: question.question,
                            correctAnswer: question.correctAnswer,
                            explanation: question.explanation,
                            type: question.type,
                            options: question.options || [],
                            documentId: document._id,
                            documentTitle: document.title
                          });
                          setFavorited(prev => ({ ...prev, [questionIndex]: res.data.favorited }));
                        } catch (e: any) {
                          const msg = e?.response?.data?.message || 'Failed to update favorite';
                          setFavoriteError(prev => ({ ...prev, [questionIndex]: msg }));
                        } finally {
                          setFavoritePending(prev => ({ ...prev, [questionIndex]: false }));
                        }
                      }}
                      className={`text-2xl leading-none ${favorited[questionIndex] ? 'text-yellow-500' : 'text-gray-300 hover:text-gray-400'} ${favoritePending[questionIndex] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {favorited[questionIndex] ? '★' : '☆'}
                    </button>
                    <button
                      onClick={async () => {
                        if (regeneratingQuestion[questionIndex]) return;
                        
                        try {
                          setRegeneratingQuestion(prev => ({ ...prev, [questionIndex]: true }));
                          // Use current question type as a hint for regeneration
                          const typeHint = question.type === 'mcq' ? 'mcq' : 'essay';
                          const res = await documentsAPI.regenerateOne(document._id, questionIndex, { type: typeHint });
                          const newQuestion = res.data.question;
                          // Replace in local state without refetch
                          setDocument(prev => prev ? ({ ...prev, questions: prev.questions.map((q, i) => i === questionIndex ? newQuestion : q) }) : prev);
                          // Reset the answer for this index
                          setAnswers(prev => prev.map((a, i) => i === questionIndex ? '' : a));
                          setAnsweredQuestions(prev => {
                            const next = new Set(Array.from(prev));
                            next.delete(questionIndex);
                            return next;
                          });
                        } catch (e: any) {
                          setError(e?.response?.data?.message || 'Failed to regenerate question');
                        } finally {
                          setRegeneratingQuestion(prev => ({ ...prev, [questionIndex]: false }));
                        }
                      }}
                      disabled={regeneratingQuestion[questionIndex]}
                      className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-800 flex items-center space-x-2"
                      title="Regenerate this question"
                    >
                      {regeneratingQuestion[questionIndex] ? (
                        <>
                          <LoadingSpinner size="sm" color="gray" />
                          <span>Regenerating...</span>
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </button>
                    {answeredQuestions.has(questionIndex) && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        Answered
                      </span>
                    )}
                  </div>
                </div>
                {favoriteError[questionIndex] && (
                  <div className="mt-2 text-xs text-red-600">{favoriteError[questionIndex]}</div>
                )}
                {formatQuestionText(question.question)}
              </div>

              {/* Answer Options */}
              <div className="space-y-4 mb-6">
                {question.type === 'mcq' && question.options ? (
                  question.options.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-center">
                      <input
                        type="radio"
                        name={`question-${questionIndex}`}
                        value={option}
                        checked={answers[questionIndex] === option}
                        onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 text-gray-700">{option}</span>
                    </label>
                  ))
                ) : (
                  <>
                    <textarea
                      value={answers[questionIndex] || ''}
                      onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-primary focus:border-primary placeholder-gray-400"
                      rows={6}
                    />
                    {answers[questionIndex] && (
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            if (essayEvalLoading[questionIndex]) return;
                            try {
                              setEssayEvalError(prev => ({ ...prev, [questionIndex]: undefined }));
                              setEssayEvalLoading(prev => ({ ...prev, [questionIndex]: true }));
                              const res = await quizAPI.gradeEssay(question.correctAnswer, answers[questionIndex]);
                              // Use the new grading structure
                              setEssayEval(prev => ({ ...prev, [questionIndex]: res.data }));
                            } catch (e: any) {
                              const msg = e?.response?.data?.message || 'Failed to grade essay';
                              setEssayEvalError(prev => ({ ...prev, [questionIndex]: msg }));
                            } finally {
                              setEssayEvalLoading(prev => ({ ...prev, [questionIndex]: false }));
                            }
                          }}
                          disabled={!!essayEvalLoading[questionIndex]}
                          className="btn-accent disabled:bg-purple-300 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          {essayEvalLoading[questionIndex] ? 'Evaluating...' : 'Evaluate Answer'}
                        </button>
                        {essayEvalError[questionIndex] && (
                          <div className="mt-2 text-sm text-red-600">{essayEvalError[questionIndex]}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Answer Status and Immediate Correctness (MCQ only) */}
              {answers[questionIndex] && question.type === 'mcq' && (
                <div className="border-t pt-4">
                  {(() => {
                    const userAnswer = (answers[questionIndex] || '').trim();
                    const correctAnswer = (question.correctAnswer || '').trim();
                    const isCorrect = question.type === 'mcq' ? isAnswerCorrect(question, userAnswer) : false;
                    return (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm font-semibold px-4 py-2 rounded-lg ${
                              isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleViewExplanation(questionIndex)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            View Explanation
                          </button>
                        </div>
                        {!isCorrect && (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">Correct Answer:</span>
                            <span className="text-sm bg-green-50 text-green-800 px-3 py-1 rounded">
                              {(() => {
                                // If correctAnswer is a letter, show the corresponding option text for clarity
                                if (question.type === 'mcq' && question.options) {
                                  const mapped = mapLetterToOption(correctAnswer, question.options);
                                  return mapped || correctAnswer;
                                }
                                return correctAnswer;
                              })()}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Essay evaluation result (only after pressing Evaluate) */}
              {answers[questionIndex] && question.type !== 'mcq' && essayEval[questionIndex] && (
                <div className="border-t pt-4">
                  {(() => {
                    const result = essayEval[questionIndex]!;
                    const score = result.score;
                    const colorBox = score >= 90
                      ? 'bg-green-50 border-green-200'
                      : score >= 80
                      ? 'bg-blue-50 border-blue-200'
                      : score >= 70
                      ? 'bg-yellow-50 border-yellow-200'
                      : score >= 60
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-red-50 border-red-200';
                    const colorText = score >= 90
                      ? 'text-green-800'
                      : score >= 80
                      ? 'text-blue-800'
                      : score >= 70
                      ? 'text-yellow-800'
                      : score >= 60
                      ? 'text-orange-800'
                      : 'text-red-800';
                    const badge = score >= 90
                      ? '🟢 Excellent'
                      : score >= 80
                      ? '🔵 Good'
                      : score >= 70
                      ? '🟡 Satisfactory'
                      : score >= 60
                      ? '🟠 Needs Improvement'
                      : '🔴 Poor';
                    
                    return (
                      <div className={`rounded border p-4 ${colorBox}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`font-semibold ${colorText}`}>{badge}</div>
                          <div className={`text-lg font-bold ${colorText}`}>
                            {result.pointsCovered}/{result.totalPoints} points ({score}%)
                          </div>
                        </div>
                        
                        {/* All Correct Points Breakdown */}
                        {result.allCorrectPoints && result.allCorrectPoints.length > 0 && (
                          <div className="mb-3">
                            <div className="font-medium text-gray-800 mb-2">
                              All Correct Points ({result.totalPoints} total):
                            </div>
                            <div className="space-y-1">
                              {result.allCorrectPoints.map((point, idx) => (
                                <div key={idx} className="flex items-start text-sm">
                                  <span className="mr-2 font-medium text-gray-600">
                                    {point.pointNumber}.
                                  </span>
                                  <span className={`mr-2 ${point.covered ? 'text-green-600' : 'text-red-600'}`}>
                                    {point.covered ? '✅' : '❌'}
                                  </span>
                                  <div className="flex-1">
                                    <span className="font-medium">{point.point}</span>
                                    {point.studentMention && (
                                      <div className="text-gray-600 text-xs mt-1">
                                        Your answer: "{point.studentMention}"
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Missed Points */}
                        {result.missedPoints && result.missedPoints.length > 0 && (
                          <div className="mb-3">
                            <div className="font-medium text-red-700 mb-2">
                              Points You Missed ({result.missedPoints.length}):
                            </div>
                            <div className="space-y-1">
                              {result.missedPoints.map((point, idx) => (
                                <div key={idx} className="flex items-start text-sm text-red-600">
                                  <span className="mr-2">❌</span>
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Feedback */}
                        {result.feedback && (
                          <div className="text-sm text-gray-800 mb-2">
                            <span className="font-medium">Overall Feedback:</span> {result.feedback}
                          </div>
                        )}
                        
                        {/* Strengths */}
                        {result.strengths && (
                          <div className="text-sm text-gray-800 mb-2">
                            <span className="font-medium text-green-700">Strengths:</span> {result.strengths}
                          </div>
                        )}
                        
                        {/* Improvements */}
                        {result.improvements && (
                          <div className="text-sm text-gray-800">
                            <span className="font-medium text-blue-700">Areas for Improvement:</span> {result.improvements}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Submit Button - Show immediately after quiz is loaded */}
        {document && (
          <div className="px-4 py-6 sm:px-0">
            <div className="card">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quiz Actions 🎯
                </h3>
                <p className="text-gray-600 mb-6">
                  You have answered {answers.filter(answer => answer && answer.trim() !== '').length} of {document.questions.length} questions. 
                  You can download your answers as PDF or submit to view results.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={handleDownloadPDF}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <span>📄</span>
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg text-lg font-semibold transition-colors duration-200"
                  >
                    {loading ? 'Submitting...' : 
                      document && document.questions.every(q => q.type === 'mcq') 
                        ? 'Submit Quiz & View Results' 
                        : 'Submit Quiz'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

      </main>

      {/* Explanation Modal */}
      {document && selectedQuestionIndex !== null && (
        <ExplanationModal
          isOpen={showExplanation}
          onClose={() => {
            setShowExplanation(false);
            setSelectedQuestionIndex(null);
          }}
          question={document.questions[selectedQuestionIndex].question}
          correctAnswer={document.questions[selectedQuestionIndex].correctAnswer}
          userAnswer={answers[selectedQuestionIndex] || ''}
          originalExplanation={document.questions[selectedQuestionIndex].explanation}
          questionType={document.questions[selectedQuestionIndex].type}
          options={document.questions[selectedQuestionIndex].options}
        />
      )}

      {/* Results Popup */}
      {showResultsPopup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white rounded-lg p-12 max-w-2xl w-full mx-4 shadow-2xl border-2 border-blue-500">
            <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
              🎯 Quiz Results
            </h2>
            
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Left Column - Numbers */}
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{total}</div>
                    <div className="text-lg font-semibold text-blue-700">Total Questions</div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">{correct}</div>
                    <div className="text-lg font-semibold text-green-700">Correct Answers</div>
                  </div>
                </div>
                
                <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">{incorrect}</div>
                    <div className="text-lg font-semibold text-red-700">Incorrect Answers</div>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Percentage */}
              <div className="flex items-center justify-center">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-full border-4 border-purple-200">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-purple-600 mb-4">
                      {total > 0 ? Math.round((correct / total) * 100) : 0}%
                    </div>
                    <div className="text-xl font-semibold text-purple-700">Accuracy Rate</div>
                    <div className="text-sm text-gray-600 mt-2">
                      {correct} out of {total} questions
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDownloadPDF}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-lg transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
              >
                <span>📄</span>
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setShowResultsPopup(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-semibold text-lg"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Notification - Above Everything */}
      {showSaveNotification && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] animate-bounce">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl shadow-2xl flex items-center space-x-4 max-w-md border-2 border-green-300">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">📄 Paper Saved!</p>
              <p className="text-sm opacity-95">Your quiz has been saved to revision history</p>
            </div>
            <button
              onClick={() => setShowSaveNotification(false)}
              className="flex-shrink-0 ml-2 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
