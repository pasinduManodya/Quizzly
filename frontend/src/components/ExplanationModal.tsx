import React, { useState } from 'react';
import { quizAPI } from '../services/api';
import EnhancedExplanationLoading from './EnhancedExplanationLoading';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: string;
  correctAnswer: string;
  userAnswer: string;
  originalExplanation: string;
  questionType?: 'mcq' | 'short' | 'essay' | 'structured_essay';
  options?: string[];
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  isOpen,
  onClose,
  question,
  correctAnswer,
  userAnswer,
  originalExplanation,
  questionType = 'mcq',
  options = []
}) => {
  const [enhancedExplanation, setEnhancedExplanation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEnhancedExplanation = async () => {
    if (enhancedExplanation) return; // Already fetched
    
    setLoading(true);
    setError('');
    
    try {
      const response = await quizAPI.getEnhancedExplanation(
        question,
        correctAnswer,
        userAnswer,
        originalExplanation
      );
      setEnhancedExplanation(response.data.enhancedExplanation);
    } catch (err: any) {
      setError('Failed to load enhanced explanation');
      console.error('Error fetching enhanced explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatExplanation = (text: string) => {
    // Enhanced professional formatting with better visual hierarchy
    let formatted = text;
    
    // Educational Topic Headers - Professional styling with icons
    const topicPatterns = [
      {
        pattern: /^(Why the correct answer is right:?)$/gim,
        title: 'Why the correct answer is right',
        icon: '✅',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      },
      {
        pattern: /^(Why other options are wrong:?)$/gim,
        title: 'Why other options are wrong',
        icon: '❌',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      {
        pattern: /^(Key concepts and principles involved:?)$/gim,
        title: 'Key concepts and principles involved',
        icon: '🔑',
        color: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      {
        pattern: /^(Real-world applications or examples:?)$/gim,
        title: 'Real-world applications or examples',
        icon: '🌍',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      },
      {
        pattern: /^(Clinical significance:?)$/gim,
        title: 'Clinical significance',
        icon: '🏥',
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200'
      },
      {
        pattern: /^(Pathophysiology:?)$/gim,
        title: 'Pathophysiology',
        icon: '🧬',
        color: 'text-teal-700',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200'
      },
      {
        pattern: /^(Diagnosis and treatment:?)$/gim,
        title: 'Diagnosis and treatment',
        icon: '🩺',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      {
        pattern: /^(Additional insights:?)$/gim,
        title: 'Additional insights',
        icon: '💡',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      {
        pattern: /^(Common misconceptions:?)$/gim,
        title: 'Common misconceptions',
        icon: '⚠️',
        color: 'text-amber-700',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      }
    ];

    // Process each topic pattern with enhanced styling
    topicPatterns.forEach(({ pattern, title, icon, color, bgColor, borderColor }) => {
      formatted = formatted.replace(pattern, 
        `<div class="mb-6 p-4 rounded-lg border-l-4 ${bgColor} ${borderColor}">
          <div class="flex items-center mb-3">
            <span class="text-2xl mr-3">${icon}</span>
            <h3 class="text-lg font-bold ${color}">${title}</h3>
          </div>
          <div class="text-gray-700 leading-relaxed">`
      );
    });

    // Enhanced headers with better styling
    formatted = formatted
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-800 mt-6 mb-4 flex items-center"><span class="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-5 border-b-2 border-gray-200 pb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-6 border-b-4 border-blue-500 pb-3">$1</h1>')
      
      // Enhanced bold and italic with better contrast
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900 bg-yellow-100 px-1 rounded">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800 font-medium">$1</em>')
      
      // Enhanced code blocks with syntax highlighting feel
      .replace(/```([\s\S]*?)```/g, '<div class="bg-gray-900 text-gray-100 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto"><code class="text-green-400">$1</code></div>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono border border-gray-300">$1</code>')
      
      // Enhanced lists with better spacing and icons
      .replace(/^- (.*$)/gim, '<li class="ml-6 mb-2 flex items-start"><span class="text-blue-500 mr-2 mt-1">•</span><span class="text-gray-700">$1</span></li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-6 mb-2 flex items-start"><span class="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-3 mt-0.5 font-bold">$&</span><span class="text-gray-700">$1</span></li>')
      
      // Enhanced blockquotes with professional styling
      .replace(/^> (.*$)/gim, '<blockquote class="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 my-4 border-l-4 border-blue-500 italic text-gray-700 shadow-sm rounded-r-lg">$1</blockquote>')
      
      // Enhanced line breaks and paragraphs with better spacing
      .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-gray-700">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-4 leading-relaxed text-gray-700">')
      .replace(/$/, '</p>')
      
      // Wrap lists in proper containers with enhanced styling
      .replace(/(<li[^>]*>.*<\/li>)/g, '<ul class="mb-6 space-y-1">$1</ul>')
      .replace(/<\/ul><ul class="mb-6 space-y-1">/g, '');

    // Close any open educational topic sections
    const openSections = (formatted.match(/<div class="mb-6 p-4 rounded-lg border-l-4/g) || []).length;
    const closeSections = (formatted.match(/<\/div><\/div>/g) || []).length;
    
    if (openSections > closeSections) {
      formatted += '</div></div>'.repeat(openSections - closeSections);
    }

    return formatted;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-white max-w-5xl w-full max-h-[95vh] overflow-hidden rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-8 py-4 sm:py-6 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">🧠</span>
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-2xl font-bold truncate">Answer Explanation</h3>
                <p className="text-blue-100 text-xs sm:text-sm hidden sm:block">Comprehensive analysis and insights</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl sm:text-3xl font-bold bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center transition-all duration-200 flex-shrink-0 ml-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 overflow-y-auto flex-1 min-h-0">
          {/* Question Section */}
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-gray-50 to-blue-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200">
            <div className="flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                Q
              </div>
              <h4 className="text-base sm:text-xl font-bold text-gray-900">Question:</h4>
            </div>
            <p className="text-sm sm:text-lg text-gray-700 leading-relaxed ml-9 sm:ml-11">{question}</p>
          </div>

          {/* MCQ Options Grid or Simple Answers */}
          {questionType === 'mcq' && options && options.length > 0 ? (
            <div className="mb-6 sm:mb-8">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4">Answer Options:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {options.map((option, index) => {
                  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                  const isCorrect = correctAnswer.toUpperCase() === optionLetter || correctAnswer === option;
                  const isUserAnswer = userAnswer.toUpperCase() === optionLetter || userAnswer === option;
                  const isWrong = isUserAnswer && !isCorrect;
                  
                  return (
                    <div
                      key={index}
                      className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        isCorrect
                          ? 'bg-green-50 border-green-500'
                          : isWrong
                          ? 'bg-red-50 border-red-500'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0 ${
                            isCorrect
                              ? 'bg-green-500 text-white'
                              : isWrong
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}
                        >
                          {optionLetter}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm sm:text-base leading-relaxed ${
                            isCorrect ? 'text-green-900 font-semibold' : isWrong ? 'text-red-900' : 'text-gray-700'
                          }`}>
                            {option}
                          </p>
                          {isCorrect && (
                            <span className="inline-flex items-center mt-2 text-xs sm:text-sm text-green-700 font-semibold">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Correct Answer
                            </span>
                          )}
                          {isWrong && (
                            <span className="inline-flex items-center mt-2 text-xs sm:text-sm text-red-700 font-semibold">
                              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-red-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-l-4 border-red-400">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                    Y
                  </div>
                  <h4 className="text-sm sm:text-lg font-bold text-red-700">Your Answer:</h4>
                </div>
                <p className="text-sm sm:text-base text-gray-700 ml-9 sm:ml-11">
                  {userAnswer || <span className="italic text-gray-500">No answer provided</span>}
                </p>
              </div>
              <div className="bg-green-50 p-4 sm:p-6 rounded-lg sm:rounded-xl border-l-4 border-green-400">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                    C
                  </div>
                  <h4 className="text-sm sm:text-lg font-bold text-green-700">Correct Answer:</h4>
                </div>
                <p className="text-sm sm:text-base text-gray-700 font-semibold ml-9 sm:ml-11">{correctAnswer}</p>
              </div>
            </div>
          )}

          {/* Enhanced Explanation Button */}
          <div className="mb-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <EnhancedExplanationLoading text="Generating enhanced explanation..." />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <button
                  onClick={fetchEnhancedExplanation}
                  disabled={!!enhancedExplanation}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                >
                  {enhancedExplanation ? (
                    <span className="flex items-center space-x-2">
                      <span>✨</span>
                      <span>Enhanced Explanation Ready</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>🚀</span>
                      <span>Get Enhanced Explanation</span>
                    </span>
                  )}
                </button>
                {!enhancedExplanation && (
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    Get a more detailed, comprehensive explanation with additional insights, examples, and context.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border-l-4 border-red-400 p-6 rounded-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  !
                </div>
                <div>
                  <h4 className="text-lg font-bold text-red-700 mb-2">Error</h4>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Original Explanation */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                📖
              </div>
              <h4 className="text-base sm:text-xl font-bold text-gray-900">Original Explanation</h4>
            </div>
            <div 
              className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm text-sm sm:text-base"
              dangerouslySetInnerHTML={{ 
                __html: formatExplanation(originalExplanation) 
              }}
            />
          </div>

          {/* Enhanced Explanation */}
          {enhancedExplanation && (
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6 flex-wrap">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">
                  ✨
                </div>
                <h4 className="text-base sm:text-xl font-bold text-gray-900">Enhanced Explanation</h4>
                <span className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                  AI Enhanced
                </span>
              </div>
              <div 
                className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm text-sm sm:text-base"
                dangerouslySetInnerHTML={{ 
                  __html: formatExplanation(enhancedExplanation) 
                }}
              />
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="bg-gray-50 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
              💡 Tip: Enhanced explanations provide deeper insights and additional context
            </div>
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;
