import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesAPI } from '../services/api';
import ExplanationModal from '../components/ExplanationModal';

interface FavoriteItem {
  _id: string;
  document: string;
  documentTitle: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  type: 'mcq' | 'short' | 'essay' | 'structured_essay';
  options?: string[];
  createdAt: string;
}

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedFavoriteIndex, setSelectedFavoriteIndex] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'topic'>('topic');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    (async () => {
      try {
        const res = await favoritesAPI.list();
        setFavorites(res.data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load favorites');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleViewExplanation = (favoriteIndex: number) => {
    setSelectedFavoriteIndex(favoriteIndex);
    setShowExplanation(true);
  };

  const sortedFavorites = [...favorites].sort((a, b) => {
    if (sortBy === 'topic') {
      return a.documentTitle.localeCompare(b.documentTitle);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const groupedFavorites = sortBy === 'topic' 
    ? sortedFavorites.reduce((groups, fav) => {
        const topic = fav.documentTitle;
        if (!groups[topic]) groups[topic] = [];
        groups[topic].push(fav);
        return groups;
      }, {} as Record<string, FavoriteItem[]>)
    : { 'All Questions': sortedFavorites };

  // Filter topics based on search term
  const filteredTopics = Object.keys(groupedFavorites).filter(topic =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter questions based on search term
  const filteredQuestions = favorites.filter(fav => {
    const searchLower = searchTerm.toLowerCase();
    return (
      fav.question.toLowerCase().includes(searchLower) ||
      fav.correctAnswer.toLowerCase().includes(searchLower) ||
      fav.explanation.toLowerCase().includes(searchLower) ||
      (fav.options && fav.options.some(option => option.toLowerCase().includes(searchLower)))
    );
  });

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleBackToTopics = () => {
    setSelectedTopic(null);
    setSearchTerm('');
  };

  // Function to highlight search terms in text
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
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
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Favorites</h1>
              <p className="text-gray-600">
                {selectedTopic ? `Questions from: ${selectedTopic}` : 'Your starred questions'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {selectedTopic && (
                <button
                  onClick={handleBackToTopics}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
                >
                  ← Back to Topics
                </button>
              )}
              {!selectedTopic && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
                  >
                    {viewMode === 'grid' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'topic')}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="topic">Topic</option>
                  <option value="date">Date Added</option>
                </select>
              </div>
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

      <main className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500">No favorites yet. Star questions during a quiz to save them here.</div>
          </div>
        ) : (
          <>
            {!selectedTopic ? (
              // Topics View
              <div>
                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search topics, questions, and answers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Search Results */}
                {searchTerm ? (
                  <div className="space-y-8">
                    {/* Topics Section */}
                    {filteredTopics.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                          Topics ({filteredTopics.length})
                        </h2>
                        <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                          {filteredTopics.map((topic) => (
                            <div
                              key={topic}
                              onClick={() => handleTopicSelect(topic)}
                              className={`card cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
                                viewMode === 'list' ? 'flex items-center space-x-4' : ''
                              }`}
                            >
                              {viewMode === 'grid' ? (
                                // Grid View
                                <div className="text-center">
                                  <div className="mb-4">
                                    <svg className="mx-auto h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    {highlightSearchTerm(topic, searchTerm)}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-4">
                                    {groupedFavorites[topic].length} question{groupedFavorites[topic].length !== 1 ? 's' : ''}
                                  </p>
                                  <div className="text-blue-600 font-medium">View Questions →</div>
                                </div>
                              ) : (
                                // List View
                                <>
                                  <div className="flex-shrink-0">
                                    <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                      {highlightSearchTerm(topic, searchTerm)}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                      {groupedFavorites[topic].length} question{groupedFavorites[topic].length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 text-blue-600 font-medium">
                                    View Questions →
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions Section */}
                    {filteredQuestions.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                          Questions & Answers ({filteredQuestions.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {filteredQuestions.map((fav, index) => (
                            <div key={fav._id} className="card">
                              {/* Question Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    fav.type === 'mcq' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : fav.type === 'essay' || fav.type === 'structured_essay'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {fav.type === 'mcq' ? 'Multiple Choice' : 
                                     fav.type === 'essay' || fav.type === 'structured_essay' ? 'Essay' : 'Short Answer'}
                                  </span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {fav.documentTitle}
                                  </span>
                                </div>
                                <button
                                  onClick={async () => {
                                    try {
                                      await favoritesAPI.remove(fav._id);
                                      setFavorites(prev => prev.filter(x => x._id !== fav._id));
                                    } catch {}
                                  }}
                                  className="text-xl leading-none text-yellow-500 hover:text-yellow-600"
                                  title="Remove from favorites"
                                >
                                  ★
                                </button>
                              </div>

                              {/* Question */}
                              <div className="mb-4">
                                <h3 className="text-base font-semibold text-gray-900 mb-2">Question:</h3>
                                <p className="text-gray-700 leading-relaxed">
                                  {highlightSearchTerm(fav.question, searchTerm)}
                                </p>
                              </div>

                              {/* Answer Options (for MCQ) */}
                              {fav.type === 'mcq' && fav.options && fav.options.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-sm font-semibold text-gray-800 mb-3">Answer Options:</h4>
                                  <div className="space-y-2">
                                    {fav.options.map((option, optionIndex) => (
                                      <div 
                                        key={optionIndex} 
                                        className={`text-sm p-3 rounded-lg border ${
                                          option === fav.correctAnswer 
                                            ? 'bg-green-50 border-green-200 text-green-800' 
                                            : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}
                                      >
                                        <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {highlightSearchTerm(option, searchTerm)}
                                        {option === fav.correctAnswer && (
                                          <span className="ml-2 text-green-600 font-semibold">✓</span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Correct Answer */}
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-2">Correct Answer:</h4>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <p className="text-green-800 font-medium">
                                    ✓ {highlightSearchTerm(fav.correctAnswer, searchTerm)}
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                                <button
                                  onClick={() => handleViewExplanation(favorites.findIndex(f => f._id === fav._id))}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                                >
                                  View Explanation
                                </button>
                                <span className="text-sm text-gray-500">
                                  {new Date(fav.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {filteredTopics.length === 0 && filteredQuestions.length === 0 && (
                      <div className="text-center py-12">
                        <div className="text-gray-500">No topics or questions found matching "{searchTerm}"</div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Default Topics View (when no search)
                  <div className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
                    {Object.keys(groupedFavorites).map((topic) => (
                      <div
                        key={topic}
                        onClick={() => handleTopicSelect(topic)}
                        className={`card cursor-pointer hover:shadow-lg transition-shadow duration-200 ${
                          viewMode === 'list' ? 'flex items-center space-x-4' : ''
                        }`}
                      >
                        {viewMode === 'grid' ? (
                          // Grid View
                          <div className="text-center">
                            <div className="mb-4">
                              <svg className="mx-auto h-12 w-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                              {groupedFavorites[topic].length} question{groupedFavorites[topic].length !== 1 ? 's' : ''}
                            </p>
                            <div className="text-blue-600 font-medium">View Questions →</div>
                          </div>
                        ) : (
                          // List View
                          <>
                            <div className="flex-shrink-0">
                              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">{topic}</h3>
                              <p className="text-sm text-gray-600">
                                {groupedFavorites[topic].length} question{groupedFavorites[topic].length !== 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="flex-shrink-0 text-blue-600 font-medium">
                              View Questions →
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Questions View for Selected Topic
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {groupedFavorites[selectedTopic].map((fav, index) => (
                    <div key={fav._id} className="card">
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            fav.type === 'mcq' 
                              ? 'bg-blue-100 text-blue-800' 
                              : fav.type === 'essay' || fav.type === 'structured_essay'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {fav.type === 'mcq' ? 'Multiple Choice' : 
                             fav.type === 'essay' || fav.type === 'structured_essay' ? 'Essay' : 'Short Answer'}
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await favoritesAPI.remove(fav._id);
                              setFavorites(prev => prev.filter(x => x._id !== fav._id));
                            } catch {}
                          }}
                          className="text-xl leading-none text-yellow-500 hover:text-yellow-600"
                          title="Remove from favorites"
                        >
                          ★
                        </button>
                      </div>

                      {/* Question */}
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-2">Question:</h3>
                        <p className="text-gray-700 leading-relaxed">{fav.question}</p>
                      </div>

                      {/* Answer Options (for MCQ) */}
                      {fav.type === 'mcq' && fav.options && fav.options.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-800 mb-3">Answer Options:</h4>
                          <div className="space-y-2">
                            {fav.options.map((option, optionIndex) => (
                              <div 
                                key={optionIndex} 
                                className={`text-sm p-3 rounded-lg border ${
                                  option === fav.correctAnswer 
                                    ? 'bg-green-50 border-green-200 text-green-800' 
                                    : 'bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className="font-medium">{String.fromCharCode(65 + optionIndex)}.</span> {option}
                                {option === fav.correctAnswer && (
                                  <span className="ml-2 text-green-600 font-semibold">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Correct Answer */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">Correct Answer:</h4>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-800 font-medium">
                            ✓ {fav.correctAnswer}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleViewExplanation(favorites.findIndex(f => f._id === fav._id))}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                        >
                          View Explanation
                        </button>
                        <span className="text-sm text-gray-500">
                          {new Date(fav.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Explanation Modal */}
      {selectedFavoriteIndex !== null && (
        <ExplanationModal
          isOpen={showExplanation}
          onClose={() => {
            setShowExplanation(false);
            setSelectedFavoriteIndex(null);
          }}
          question={favorites[selectedFavoriteIndex].question}
          correctAnswer={favorites[selectedFavoriteIndex].correctAnswer}
          userAnswer="" // No user answer for favorites
          originalExplanation={favorites[selectedFavoriteIndex].explanation}
          questionType={favorites[selectedFavoriteIndex].type}
          options={favorites[selectedFavoriteIndex].options}
        />
      )}
    </div>
  );
};

export default Favorites;


