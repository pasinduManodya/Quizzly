import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI, quizAPI, favoritesAPI } from '../services/api';
import ExplanationModal from '../components/ExplanationModal';
import Stopwatch from '../components/Stopwatch';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateQuizPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import '../styles/quiz.css';

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
  const { user } = useAuth();
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
  const [generatingMore, setGeneratingMore] = useState(false);
  const [generateMoreError, setGenerateMoreError] = useState('');
  

  const fetchDocument = useCallback(async () => {
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
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

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
      quizDuration,
      userName: user?.email?.split('@')[0] || 'Student',
      userEmail: user?.email || ''
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
      <div className="quiz-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', border: '3px solid #4361ee', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ fontSize: '1rem', color: '#4a4a6a', fontFamily: 'Outfit, sans-serif' }}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error && !document) {
    return (
      <div className="quiz-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.75rem', fontWeight: 700, color: '#12122a', marginBottom: '12px' }}>Error Loading Quiz</h2>
          <p style={{ fontSize: '1rem', color: '#4a4a6a', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="dash-btn dash-btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!document) return null;

  const answeredCount = answeredQuestions.size;
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
    <div className="quiz-page">
      {/* Header */}
      <header className="quiz-header">
        <div className="quiz-header-inner">
          {/* Title Section */}
          <div className="quiz-title-section">
            <h1 className="quiz-title">{document.title}</h1>
            <p className="quiz-subtitle">
              Answered {answeredCount} of {document.questions.length} questions
            </p>
          </div>
          
          {/* Timer and Button Section */}
          <div className="quiz-header-actions">
            {/* Timer */}
            <div className="quiz-timer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <Stopwatch onTimeUpdate={setQuizDuration} />
            </div>
            
            {/* Back Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="dash-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="quiz-main">
        {/* Progress Bar */}
        <div className="quiz-progress-card">
          <div className="progress-label">
            <span className="progress-text">Quiz Progress</span>
            <span className="progress-percent">{Math.round(progress)}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        {/* All Questions */}
        <div>
          {document.questions.map((question, questionIndex) => (
            <div key={question._id} className="question-card" style={{ animationDelay: `${questionIndex * 0.05}s` }}>
              <div className="question-header">
                <h2 className="question-number">
                  Question {questionIndex + 1}
                </h2>
                <div className="question-actions">
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
                    className={`favorite-btn ${favorited[questionIndex] ? 'active' : 'inactive'} ${favoritePending[questionIndex] ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={favoritePending[questionIndex]}
                  >
                    {favorited[questionIndex] ? '★' : '☆'}
                  </button>
                  <button
                    onClick={async () => {
                      if (regeneratingQuestion[questionIndex]) return;
                      
                      try {
                        setRegeneratingQuestion(prev => ({ ...prev, [questionIndex]: true }));
                        const typeHint = question.type === 'mcq' ? 'mcq' : 'essay';
                        const res = await documentsAPI.regenerateOne(document._id, questionIndex, { type: typeHint });
                        const newQuestion = res.data.question;
                        setDocument(prev => prev ? ({ ...prev, questions: prev.questions.map((q, i) => i === questionIndex ? newQuestion : q) }) : prev);
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
                    className="regenerate-btn"
                    title="Regenerate this question"
                  >
                    {regeneratingQuestion[questionIndex] ? (
                      <>
                        <LoadingSpinner size="sm" color="gray" />
                        <span>Regenerating...</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="23 4 23 10 17 10"/>
                          <polyline points="1 20 1 14 7 14"/>
                          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        <span>Regenerate</span>
                      </>
                    )}
                  </button>
                  {answeredQuestions.has(questionIndex) && (
                    <span className="answered-badge">Answered</span>
                  )}
                </div>
              </div>
              {favoriteError[questionIndex] && (
                <div className="error-message" style={{ marginBottom: '16px' }}>{favoriteError[questionIndex]}</div>
              )}
              <div className="question-text">
                {formatQuestionText(question.question)}
              </div>

              {/* Answer Options */}
              <div className="question-options">
                {question.type === 'mcq' && question.options ? (
                  question.options.map((option, optionIndex) => {
                    const optionLabel = String.fromCharCode(65 + optionIndex);
                    return (
                      <label key={optionIndex} className="option-label">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={option}
                          checked={answers[questionIndex] === option}
                          onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                        />
                        <span className="option-text">
                          <span className="option-letter">{optionLabel}.</span> {option}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <>
                    <textarea
                      value={answers[questionIndex] || ''}
                      onChange={(e) => handleAnswerChange(questionIndex, e.target.value)}
                      placeholder="Type your answer here..."
                      className="essay-textarea"
                      rows={6}
                    />
                    {answers[questionIndex] && (
                      <div>
                        <button
                          onClick={async () => {
                            if (essayEvalLoading[questionIndex]) return;
                            try {
                              setEssayEvalError(prev => ({ ...prev, [questionIndex]: undefined }));
                              setEssayEvalLoading(prev => ({ ...prev, [questionIndex]: true }));
                              const res = await quizAPI.gradeEssay(question.correctAnswer, answers[questionIndex]);
                              setEssayEval(prev => ({ ...prev, [questionIndex]: res.data }));
                            } catch (e: any) {
                              const msg = e?.response?.data?.message || 'Failed to grade essay';
                              setEssayEvalError(prev => ({ ...prev, [questionIndex]: msg }));
                            } finally {
                              setEssayEvalLoading(prev => ({ ...prev, [questionIndex]: false }));
                            }
                          }}
                          disabled={!!essayEvalLoading[questionIndex]}
                          className="evaluate-btn"
                        >
                          {essayEvalLoading[questionIndex] ? 'Evaluating...' : 'Evaluate Answer'}
                        </button>
                        {essayEvalError[questionIndex] && (
                          <div className="error-message" style={{ marginTop: '12px' }}>{essayEvalError[questionIndex]}</div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Answer Status and Immediate Correctness (MCQ only) */}
              {answers[questionIndex] && question.type === 'mcq' && (
                <div className="answer-status">
                  {(() => {
                    const userAnswer = (answers[questionIndex] || '').trim();
                    const correctAnswer = (question.correctAnswer || '').trim();
                    const isCorrect = question.type === 'mcq' ? isAnswerCorrect(question, userAnswer) : false;
                    return (
                      <>
                        <div className="status-header">
                          <span className={`status-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              {isCorrect ? (
                                <polyline points="20 6 9 17 4 12"/>
                              ) : (
                                <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                              )}
                            </svg>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <button
                            onClick={() => handleViewExplanation(questionIndex)}
                            className="explanation-btn"
                          >
                            View Explanation
                          </button>
                        </div>
                        {!isCorrect && (
                          <div className="correct-answer-display">
                            <span className="correct-answer-label">Correct Answer:</span>
                            <span className="correct-answer-value">
                              {(() => {
                                if (question.type === 'mcq' && question.options) {
                                  // Find the option index
                                  const mapped = mapLetterToOption(correctAnswer, question.options);
                                  const answerText = mapped || correctAnswer;
                                  
                                  // Find which option letter this corresponds to
                                  let optionLetter = '';
                                  if (question.options) {
                                    const index = question.options.findIndex(opt => 
                                      normalizeAnswer(opt) === normalizeAnswer(answerText) ||
                                      normalizeAnswer(opt) === normalizeAnswer(correctAnswer)
                                    );
                                    if (index !== -1) {
                                      optionLetter = String.fromCharCode(65 + index) + '. ';
                                    }
                                  }
                                  
                                  return optionLetter + answerText;
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
          <div className="quiz-actions-card">
            <h3 className="actions-title">Quiz Actions</h3>
            <p className="actions-subtitle">
              You have answered {answers.filter(answer => answer && answer.trim() !== '').length} of {document.questions.length} questions. 
              Download your answers as PDF or submit to view results.
            </p>
            
            {generateMoreError && (
              <div className="error-message" style={{ marginBottom: '24px' }}>
                {generateMoreError}
              </div>
            )}
            
            <div className="actions-buttons">
              <button
                onClick={handleDownloadPDF}
                className="action-btn action-btn-primary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </button>
              <button
                onClick={async () => {
                  try {
                    setGeneratingMore(true);
                    setGenerateMoreError('');
                    const questionType = document.questions[0]?.type === 'mcq' ? 'mcq' : 'essay';
                    const res = await documentsAPI.generateMore(document._id, {
                      type: questionType,
                      numQuestions: 5
                    });
                    setDocument(prev => prev ? {
                      ...prev,
                      questions: [...prev.questions, ...res.data.newQuestions]
                    } : prev);
                    setAnswers(prev => [...prev, ...new Array(res.data.newQuestions.length).fill('')]);
                    setGenerateMoreError(`Generated ${res.data.newQuestionsCount} new questions successfully!`);
                    setTimeout(() => setGenerateMoreError(''), 4000);
                  } catch (e: any) {
                    const msg = e?.response?.data?.message || 'Failed to generate more questions';
                    setGenerateMoreError(msg);
                  } finally {
                    setGeneratingMore(false);
                  }
                }}
                disabled={generatingMore}
                className="action-btn action-btn-secondary"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {generatingMore ? 'Generating...' : 'Generate More Questions'}
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={loading}
                className="action-btn action-btn-success"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {loading ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="quiz-footer">
        <div className="footer-inner">
          <div className="footer-stats">
            <div className="footer-stat">
              <div className="footer-stat-value">{document.questions.length}</div>
              <div className="footer-stat-label">Total Questions</div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat-value">{answeredCount}</div>
              <div className="footer-stat-label">Answered</div>
            </div>
            <div className="footer-stat">
              <div className="footer-stat-value">{Math.round(progress)}%</div>
              <div className="footer-stat-label">Progress</div>
            </div>
          </div>
          <div className="footer-divider"></div>
          <p className="footer-text">Quizzly - Intelligent Learning Platform</p>
        </div>
      </footer>

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
        <div className="results-modal-overlay">
          <div className="results-modal">
            <h2 className="results-title">Quiz Results</h2>
            
            <div className="results-grid">
              <div className="result-card total">
                <div className="result-value total">{total}</div>
                <div className="result-label">Total Questions</div>
              </div>
              
              <div className="result-card correct">
                <div className="result-value correct">{correct}</div>
                <div className="result-label">Correct Answers</div>
              </div>
              
              <div className="result-card incorrect">
                <div className="result-value incorrect">{incorrect}</div>
                <div className="result-label">Incorrect Answers</div>
              </div>
              
              <div className="result-card accuracy">
                <div className="result-value accuracy">
                  {total > 0 ? Math.round((correct / total) * 100) : 0}%
                </div>
                <div className="result-label">Accuracy Rate</div>
              </div>
            </div>
            
            <div className="results-actions">
              <button
                onClick={handleDownloadPDF}
                className="action-btn action-btn-success"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download PDF
              </button>
              <button
                onClick={() => setShowResultsPopup(false)}
                className="action-btn action-btn-primary"
              >
                Close Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Notification */}
      {showSaveNotification && (
        <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, animation: 'fadeUp 0.3s ease both' }}>
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '16px', maxWidth: '400px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>Quiz Saved!</p>
              <p style={{ fontSize: '0.875rem', opacity: 0.95 }}>Your quiz has been saved to revision history</p>
            </div>
            <button
              onClick={() => setShowSaveNotification(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
