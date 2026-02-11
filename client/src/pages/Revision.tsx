import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import { generateQuizPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';

interface QuizResult {
  _id: string;
  document: {
    _id: string;
    title: string;
  };
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface RevisionItem {
  quizResultId: string;
  documentTitle: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
  questionScore: number;
  maxQuestionScore: number;
  completedAt: string;
  totalScore: number;
  maxPossibleScore: number;
}

const Revision: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [revisionItems, setRevisionItems] = useState<RevisionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'mistakes'>('history');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    fetchRevisionData();
  }, []);

  const fetchRevisionData = async () => {
    console.log('🔄 FETCHING REVISION DATA...');
    try {
      // Fetch both all quiz history and saved revisions
      console.log('📡 Making API calls...');
      const [historyResponse, revisionResponse] = await Promise.all([
        quizAPI.getHistory(),
        quizAPI.getRevision()
      ]);
      
      console.log('📚 History API response:', historyResponse.data);
      console.log('📚 History data length:', historyResponse.data.length);
      console.log('📚 Revision API response:', revisionResponse.data);
      console.log('📚 Revision data length:', revisionResponse.data.length);
      
      // Use all quiz history for the history tab
      setQuizHistory(historyResponse.data);
      setRevisionItems(revisionResponse.data);
      console.log('✅ Data set successfully');
    } catch (error) {
      console.error('❌ Error fetching revision data:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Loading completed');
    }
  };

  const handleViewQuizResult = async (quizResultId: string) => {
    try {
      const response = await quizAPI.getResult(quizResultId);
      setSelectedQuiz(response.data);
      setShowQuizModal(true);
    } catch (error) {
      console.error('Error fetching quiz result:', error);
      alert('Failed to load quiz details. Please try again.');
    }
  };

  const handleDeleteRevision = async (quizResultId: string) => {
    console.log('🗑️ DELETE BUTTON CLICKED');
    console.log('📋 Quiz ID:', quizResultId);
    console.log('📋 Quiz ID type:', typeof quizResultId);
    
    // Show custom confirmation modal
    setQuizToDelete(quizResultId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!quizToDelete) return;
    
    console.log('✅ User confirmed deletion via custom modal');
    setShowDeleteConfirm(false);
    setDeletingQuizId(quizToDelete);
    console.log('🔄 Set deletingQuizId to:', quizToDelete);
    
    try {
      console.log('🚀 Starting API call to deleteQuiz...');
      console.log('🔗 API endpoint: /api/quiz/delete/' + quizToDelete);
      
      const response = await quizAPI.deleteQuiz(quizToDelete);
      console.log('✅ API call successful!');
      console.log('📄 Response:', response);
      console.log('📄 Response data:', response.data);
      
      console.log('🔄 Refreshing data...');
      
      // Immediately remove the quiz from the current state
      console.log('🗑️ Removing quiz from current state...');
      setQuizHistory(prevHistory => {
        const newHistory = prevHistory.filter(quiz => quiz._id !== quizToDelete);
        console.log('🗑️ Previous history length:', prevHistory.length);
        console.log('🗑️ New history length:', newHistory.length);
        console.log('🗑️ Quiz removed from state:', !newHistory.some(q => q._id === quizToDelete));
        return newHistory;
      });
      
      setRevisionItems(prevItems => {
        const newItems = prevItems.filter(item => item.quizResultId !== quizToDelete);
        console.log('🗑️ Previous revision items length:', prevItems.length);
        console.log('🗑️ New revision items length:', newItems.length);
        return newItems;
      });
      
      // Also refresh data to ensure consistency
      fetchRevisionData();
      console.log('✅ Data refresh completed');
      
      // Let's also check if the quiz is still in the current state
      console.log('🔍 Current quizHistory state:', quizHistory.length, 'quizzes');
      console.log('🔍 Quiz IDs in current state:', quizHistory.map(q => q._id));
      console.log('🔍 Is deleted quiz still in state?', quizHistory.some(q => q._id === quizToDelete));
      
    } catch (error: any) {
      console.error('❌ DELETE ERROR OCCURRED:');
      console.error('❌ Error object:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error response data:', error.response?.data);
      console.error('❌ Error response status:', error.response?.status);
      console.error('❌ Error response statusText:', error.response?.statusText);
      
      const errorMessage = error.response?.data?.message || 'Failed to delete quiz. Please try again.';
      console.log('📢 Showing error message to user:', errorMessage);
      alert(errorMessage);
    } finally {
      console.log('🧹 Cleaning up - setting deletingQuizId to null');
      setDeletingQuizId(null);
      setQuizToDelete(null);
      console.log('✅ Cleanup completed');
    }
  };

  const cancelDelete = () => {
    console.log('❌ User cancelled deletion via custom modal');
    setShowDeleteConfirm(false);
    setQuizToDelete(null);
  };

  const handleDeleteAll = () => {
    console.log('🗑️ DELETE ALL BUTTON CLICKED');
    setShowDeleteAllConfirm(true);
  };

  const confirmDeleteAll = async () => {
    console.log('✅ User confirmed delete all');
    setShowDeleteAllConfirm(false);
    setDeletingAll(true);
    
    try {
      console.log('🚀 Starting delete all operation...');
      
      // Delete all quizzes one by one
      const quizzesToDelete = [...quizHistory];
      console.log('📋 Quizzes to delete:', quizzesToDelete.length);
      
      for (const quiz of quizzesToDelete) {
        try {
          console.log('🗑️ Deleting quiz:', quiz._id);
          await quizAPI.deleteQuiz(quiz._id);
          console.log('✅ Deleted quiz:', quiz._id);
        } catch (error) {
          console.error('❌ Failed to delete quiz:', quiz._id, error);
        }
      }
      
      console.log('🔄 Refreshing data...');
      fetchRevisionData();
      console.log('✅ Delete all completed');
      
    } catch (error: any) {
      console.error('❌ DELETE ALL ERROR:', error);
      alert('Failed to delete all quizzes. Please try again.');
    } finally {
      setDeletingAll(false);
    }
  };

  const cancelDeleteAll = () => {
    console.log('❌ User cancelled delete all');
    setShowDeleteAllConfirm(false);
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatExplanation = (explanation: string) => {
    if (!explanation) return '';
    
    // Enhanced formatting with topic patterns and icons
    const topicPatterns = [
      { pattern: /(key concept|main concept|primary concept)/gi, icon: '🔑' },
      { pattern: /(important|critical|essential|vital)/gi, icon: '⭐' },
      { pattern: /(example|for instance|such as)/gi, icon: '💡' },
      { pattern: /(note|remember|keep in mind)/gi, icon: '📝' },
      { pattern: /(warning|caution|be careful)/gi, icon: '⚠️' },
      { pattern: /(definition|define|means)/gi, icon: '📖' },
      { pattern: /(process|steps|procedure)/gi, icon: '🔄' },
      { pattern: /(difference|distinguish|compare)/gi, icon: '⚖️' },
      { pattern: /(advantage|benefit|pros)/gi, icon: '✅' },
      { pattern: /(disadvantage|limitation|cons)/gi, icon: '❌' }
    ];

    let formatted = explanation;

    // Apply topic patterns with icons
    topicPatterns.forEach(({ pattern, icon }) => {
      formatted = formatted.replace(pattern, `${icon} $1`);
    });

    // Convert markdown-style formatting
    formatted = formatted
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-800 mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mb-3 mt-5">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mb-4 mt-6">$1</h1>')
      
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>')
      
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-3"><code class="text-sm">$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
      
      // Lists
      .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-300 pl-4 italic text-gray-700 my-3">$1</blockquote>')
      
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');

    // Wrap in paragraph if not already wrapped
    if (!formatted.startsWith('<')) {
      formatted = `<p class="mb-3">${formatted}</p>`;
    }

    return formatted;
  };

  const handleDownloadQuizPDF = () => {
    if (!selectedQuiz) return;
    
    // Create a quiz result object in the format expected by generateQuizPDF
    const quizResult = {
      document: selectedQuiz.document,
      answers: selectedQuiz.answers,
      total: selectedQuiz.totalQuestions,
      correct: selectedQuiz.score,
      incorrect: selectedQuiz.totalQuestions - selectedQuiz.score,
      quizDuration: 0, // We don't have duration in this context
      userName: user?.email?.split('@')[0] || 'Student',
      userEmail: user?.email || ''
    };
    
    generateQuizPDF(quizResult);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revision History</h1>
              <p className="text-gray-600">Track your learning progress and review mistakes</p>
            </div>
            <div className="flex space-x-3">
              {quizHistory.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    deletingAll
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {deletingAll ? '⏳ Deleting All...' : '🗑️ Delete All'}
                </button>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Quiz History ({quizHistory.length})
                </button>
                <button
                  onClick={() => setActiveTab('mistakes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'mistakes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Mistakes to Review ({revisionItems.length})
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Quiz History Tab */}
        {activeTab === 'history' && (
          <div className="px-4 py-6 sm:px-0">
            {quizHistory.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No quiz history available. Take your first quiz to see results here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {quizHistory.map((quiz) => (
                  <div key={quiz._id} className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {quiz.document?.title || 'Unknown Document'}
                      </h3>
                      <div className="mt-2">
                        <div className={`text-2xl font-bold ${getScoreColor(quiz.score, quiz.totalQuestions)}`}>
                          {quiz.score}/{quiz.totalQuestions}
                        </div>
                        <div className="text-sm text-gray-500">
                          {Math.round((quiz.score / quiz.totalQuestions) * 100)}% correct
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Completed: {new Date(quiz.completedAt).toLocaleDateString()}
                      </p>
                      <div className="mt-4 flex space-x-2">
                        <button
                          onClick={() => handleViewQuizResult(quiz._id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            console.log('🖱️ DELETE BUTTON CLICKED IN UI');
                            console.log('🖱️ Quiz ID from button:', quiz._id);
                            handleDeleteRevision(quiz._id);
                          }}
                          disabled={deletingQuizId === quiz._id}
                          className={`px-4 py-2 rounded-md text-sm font-medium min-w-[50px] cursor-pointer ${
                            deletingQuizId === quiz._id
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                          title="Delete this quiz"
                        >
                          {deletingQuizId === quiz._id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mistakes Tab */}
        {activeTab === 'mistakes' && (
          <div className="px-4 py-6 sm:px-0">
            {revisionItems.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-green-600 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Great job!</h3>
                <p className="text-gray-500">No mistakes to review. Keep up the excellent work!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {revisionItems.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.documentTitle}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Quiz taken: {new Date(item.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewQuizResult(item.quizResultId)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                        >
                          View Quiz
                        </button>
                        <button
                          onClick={() => {
                            console.log('🖱️ DELETE BUTTON CLICKED IN MISTAKES TAB');
                            console.log('🖱️ Quiz Result ID from button:', item.quizResultId);
                            handleDeleteRevision(item.quizResultId);
                          }}
                          disabled={deletingQuizId === item.quizResultId}
                          className={`px-3 py-1 rounded-md text-sm ${
                            deletingQuizId === item.quizResultId
                              ? 'bg-gray-400 cursor-not-allowed'
                              : 'bg-red-600 hover:bg-red-700'
                          } text-white`}
                        >
                          {deletingQuizId === item.quizResultId ? '⏳' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                        <p className="text-gray-700">{item.question}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className={`font-medium mb-1 ${item.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                            Your Answer:
                          </h4>
                          <p className="text-gray-700">{item.userAnswer || 'No answer provided'}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-600 mb-1">Correct Answer:</h4>
                          <p className="text-gray-700">{item.correctAnswer}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Explanation:</h4>
                        <p className="text-gray-700">{item.explanation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Summary */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{quizHistory.length}</div>
                <div className="text-sm text-gray-500">Total Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{revisionItems.length}</div>
                <div className="text-sm text-gray-500">Mistakes to Review</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {quizHistory.length > 0 
                    ? Math.round(quizHistory.reduce((acc, quiz) => acc + (quiz.score / quiz.totalQuestions), 0) / quizHistory.length * 100)
                    : 0}%
                </div>
                <div className="text-sm text-gray-500">Average Score</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Quiz Details Modal */}
      {showQuizModal && selectedQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">
                Quiz Details: {selectedQuiz.document?.title || 'Unknown Document'}
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadQuizPDF}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowQuizModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Quiz Summary */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{selectedQuiz.totalQuestions}</div>
                    <div className="text-sm text-gray-500">Total Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{selectedQuiz.score}</div>
                    <div className="text-sm text-gray-500">Correct</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{selectedQuiz.totalQuestions - selectedQuiz.score}</div>
                    <div className="text-sm text-gray-500">Incorrect</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((selectedQuiz.score / selectedQuiz.totalQuestions) * 100)}%
                    </div>
                    <div className="text-sm text-gray-500">Accuracy</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  Completed: {new Date(selectedQuiz.completedAt).toLocaleString()}
                </div>
              </div>

              {/* Questions and Answers */}
              <div className="space-y-6">
                {selectedQuiz.document?.questions?.map((question: any, index: number) => {
                  const userAnswer = selectedQuiz.answers[index] || '';
                  const isCorrect = question.type === 'mcq' 
                    ? userAnswer === question.correctAnswer
                    : userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
                  
                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Question {index + 1}
                        </h3>
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          isCorrect 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-800 font-medium mb-2">{question.question}</p>
                        {question.type === 'mcq' && question.options && (
                          <div className="ml-4 space-y-1">
                            {question.options.map((option: string, optIndex: number) => (
                              <div key={optIndex} className={`p-2 rounded ${
                                option === question.correctAnswer 
                                  ? 'bg-green-100 border-green-300' 
                                  : option === userAnswer && !isCorrect
                                    ? 'bg-red-100 border-red-300'
                                    : 'bg-gray-50'
                              }`}>
                                {option}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Your Answer:</h4>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded">
                            {userAnswer || 'No answer provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Correct Answer:</h4>
                          <p className="text-gray-700 bg-green-50 p-2 rounded border border-green-200">
                            {question.correctAnswer}
                          </p>
                        </div>
                      </div>
                      
                      {question.explanation && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-1">Explanation:</h4>
                          <div 
                            className="text-gray-700 bg-blue-50 p-3 rounded border border-blue-200"
                            dangerouslySetInnerHTML={{ __html: formatExplanation(question.explanation) }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setShowQuizModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete Quiz</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete this quiz from your history? This action cannot be undone.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delete Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Delete All Quizzes</h3>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete ALL {quizHistory.length} quizzes from your history? 
                This action cannot be undone and will permanently remove all your quiz data.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDeleteAll}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAll}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Delete All Quizzes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Revision;
