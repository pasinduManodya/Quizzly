import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface QuizResult {
  _id: string;
  document: {
    _id: string;
    title: string;
  };
  answers: Array<{
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
    question: string;
    correctAnswer: string;
    explanation: string;
    options: string[];
    type: string;
    essayGrading?: {
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
    };
    questionScore: number;
    maxQuestionScore: number;
  }>;
  score: number;
  totalQuestions: number;
  totalScore: number;
  maxPossibleScore: number;
  completedAt: string;
}

const ResultSheet: React.FC = () => {
  const { quizResultId } = useParams<{ quizResultId: string }>();
  const navigate = useNavigate();
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizResult();
  }, [quizResultId]);

  const fetchQuizResult = async () => {
    try {
      const response = await quizAPI.getResult(quizResultId!);
      setQuizResult(response.data);
    } catch (error) {
      console.error('Error fetching quiz result:', error);
      setError('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };


  const getScoreBadge = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (percentage >= 80) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 70) return { text: 'Satisfactory', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 60) return { text: 'Needs Improvement', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !quizResult) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Quiz result not found'}</p>
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

  const percentage = Math.round((quizResult.totalScore / quizResult.maxPossibleScore) * 100);
  const correctAnswers = quizResult.answers.filter(answer => answer.isCorrect).length;
  
  console.log('🔍 DEBUGGING RESULT SHEET:');
  console.log('Quiz Result:', quizResult);
  console.log('Answers:', quizResult.answers);
  console.log('Correct Answers Count:', correctAnswers);
  console.log('Total Score:', quizResult.totalScore);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quiz Results</h1>
              <p className="text-gray-600">{quizResult.document.title}</p>
              <p className="text-sm text-gray-500">
                Completed on {new Date(quizResult.completedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-4">
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Action Buttons */}
        <div className="px-4 py-6 sm:px-0">
          <div className="card">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Quiz Complete!
              </h2>
              
              <p className="text-xl text-gray-600 mb-8">
                {correctAnswers} correct answers
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-md mx-auto">
                <button
                  onClick={() => navigate(`/quiz/${quizResult.document._id}`)}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105"
                >
                  🔄 Retake Quiz
                </button>
                <button
                  onClick={() => navigate('/revision')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-medium transition-all transform hover:scale-105"
                >
                  📚 Review Mistakes
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default ResultSheet;

