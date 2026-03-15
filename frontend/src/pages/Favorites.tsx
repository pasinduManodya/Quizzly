import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoritesAPI } from '../services/api';
import ExplanationModal from '../components/ExplanationModal';
import '../styles/favorites.css';

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

  // Reset selectedTopic when changing sort mode
  const handleSortChange = (newSortBy: 'date' | 'topic') => {
    setSortBy(newSortBy);
    if (newSortBy === 'date') {
      setSelectedTopic(null); // Clear selected topic when switching to date view
    }
  };

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
          <mark key={index} className="highlight">
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  if (loading) {
    return (
      <div className="favorites-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', border: '3px solid #4361ee', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ fontSize: '1rem', color: '#4a4a6a', fontFamily: 'Outfit, sans-serif' }}>Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <header className="favorites-header">
        <div className="favorites-header-inner">
          <div className="favorites-title-section">
            <h1>Favorites</h1>
            <p>{selectedTopic ? `Questions from: ${selectedTopic}` : 'Your starred questions'}</p>
          </div>
          <div className="favorites-header-actions">
            {selectedTopic && (
              <button onClick={handleBackToTopics} className="dash-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Topics
              </button>
            )}
            {!selectedTopic && (
              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  title="Grid View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                  title="List View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label className="sort-label">Sort by:</label>
              <select value={sortBy} onChange={(e) => handleSortChange(e.target.value as 'date' | 'topic')} className="sort-select">
                <option value="topic">Topic</option>
                <option value="date">Date Added</option>
              </select>
            </div>
            <button onClick={() => navigate('/dashboard')} className="dash-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="favorites-main">
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#dc2626', padding: '14px 18px', borderRadius: '12px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="empty-state-text">No favorites yet. Star questions during a quiz to save them here.</p>
          </div>
        ) : (
          <>
            {!selectedTopic ? (
              // Topics View
              <div>
                {/* Search Bar */}
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search topics, questions, and answers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Search Results */}
                {searchTerm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
                    {/* Topics Section */}
                    {sortBy === 'topic' && filteredTopics.length > 0 && (
                      <div>
                        <h2 className="section-header">
                          Topics<span className="section-count">({filteredTopics.length})</span>
                        </h2>
                        <div className={viewMode === 'grid' ? 'topics-grid' : 'topics-list'}>
                          {filteredTopics.map((topic, index) => (
                            <div
                              key={topic}
                              onClick={() => handleTopicSelect(topic)}
                              className={`topic-card ${viewMode === 'list' ? 'list-view' : ''}`}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                              <svg className="topic-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <h3 className="topic-title">
                                {highlightSearchTerm(topic, searchTerm)}
                              </h3>
                              <p className="topic-count">
                                {groupedFavorites[topic].length} question{groupedFavorites[topic].length !== 1 ? 's' : ''}
                              </p>
                              <div className="topic-link">
                                View Questions
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12"/>
                                  <polyline points="12 5 19 12 12 19"/>
                                </svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Questions Section */}
                    {filteredQuestions.length > 0 && (
                      <div>
                        <h2 className="section-header">
                          Questions & Answers<span className="section-count">({filteredQuestions.length})</span>
                        </h2>
                        <div className="questions-grid">
                          {filteredQuestions.map((fav, index) => (
                            <div key={fav._id} className="question-card" style={{ animationDelay: `${index * 0.05}s` }}>
                              <div className="question-header">
                                <div className="question-badges">
                                  <span className={`question-type-badge ${
                                    fav.type === 'mcq' ? 'mcq' : 
                                    fav.type === 'essay' || fav.type === 'structured_essay' ? 'essay' : 'short'
                                  }`}>
                                    {fav.type === 'mcq' ? 'Multiple Choice' : 
                                     fav.type === 'essay' || fav.type === 'structured_essay' ? 'Essay' : 'Short Answer'}
                                  </span>
                                  <span className="topic-badge" title={fav.documentTitle}>
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
                                  className="favorite-star"
                                  title="Remove from favorites"
                                >
                                  ★
                                </button>
                              </div>

                              <div className="question-section">
                                <h3 className="question-label">Question:</h3>
                                <p className="question-text">
                                  {highlightSearchTerm(fav.question, searchTerm)}
                                </p>
                              </div>

                              {fav.type === 'mcq' && fav.options && fav.options.length > 0 && (
                                <div className="question-section">
                                  <h4 className="question-label">Answer Options:</h4>
                                  <div className="options-list">
                                    {fav.options.map((option, optionIndex) => (
                                      <div 
                                        key={optionIndex} 
                                        className={`option-item ${option === fav.correctAnswer ? 'correct' : 'normal'}`}
                                      >
                                        <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + optionIndex)}.</span> {highlightSearchTerm(option, searchTerm)}
                                        {option === fav.correctAnswer && <span style={{ marginLeft: '8px' }}>✓</span>}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="question-section">
                                <h4 className="question-label">Correct Answer:</h4>
                                <div className="correct-answer-box">
                                  <p className="correct-answer-text">
                                    ✓ {highlightSearchTerm(fav.correctAnswer, searchTerm)}
                                  </p>
                                </div>
                              </div>

                              <div className="question-footer">
                                <button
                                  onClick={() => handleViewExplanation(favorites.findIndex(f => f._id === fav._id))}
                                  className="dash-btn dash-btn-primary"
                                >
                                  View Explanation
                                </button>
                                <span className="question-date">
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
                      <div className="empty-state">
                        <p className="empty-state-text">No topics or questions found matching "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                ) : sortBy === 'topic' ? (
                  // Default Topics View (when no search and sorted by topic)
                  <div className={viewMode === 'grid' ? 'topics-grid' : 'topics-list'}>
                    {Object.keys(groupedFavorites).map((topic, index) => (
                      <div
                        key={topic}
                        onClick={() => handleTopicSelect(topic)}
                        className={`topic-card ${viewMode === 'list' ? 'list-view' : ''}`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <svg className="topic-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 className="topic-title">{topic}</h3>
                        <p className="topic-count">
                          {groupedFavorites[topic].length} question{groupedFavorites[topic].length !== 1 ? 's' : ''}
                        </p>
                        <div className="topic-link">
                          View Questions
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"/>
                            <polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Date View - Show all questions sorted by date
                  <div>
                    <h2 className="section-header">
                      All Questions<span className="section-count">({sortedFavorites.length})</span>
                    </h2>
                    <div className="questions-grid">
                      {sortedFavorites.map((fav, index) => (
                        <div key={fav._id} className="question-card" style={{ animationDelay: `${index * 0.05}s` }}>
                          <div className="question-header">
                            <div className="question-badges">
                              <span className={`question-type-badge ${
                                fav.type === 'mcq' ? 'mcq' : 
                                fav.type === 'essay' || fav.type === 'structured_essay' ? 'essay' : 'short'
                              }`}>
                                {fav.type === 'mcq' ? 'Multiple Choice' : 
                                 fav.type === 'essay' || fav.type === 'structured_essay' ? 'Essay' : 'Short Answer'}
                              </span>
                              <span className="topic-badge" title={fav.documentTitle}>
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
                              className="favorite-star"
                              title="Remove from favorites"
                            >
                              ★
                            </button>
                          </div>

                          <div className="question-section">
                            <h3 className="question-label">Question:</h3>
                            <p className="question-text">{fav.question}</p>
                          </div>

                          {fav.type === 'mcq' && fav.options && fav.options.length > 0 && (
                            <div className="question-section">
                              <h4 className="question-label">Answer Options:</h4>
                              <div className="options-list">
                                {fav.options.map((option, optionIndex) => (
                                  <div 
                                    key={optionIndex} 
                                    className={`option-item ${option === fav.correctAnswer ? 'correct' : 'normal'}`}
                                  >
                                    <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + optionIndex)}.</span> {option}
                                    {option === fav.correctAnswer && <span style={{ marginLeft: '8px' }}>✓</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="question-section">
                            <h4 className="question-label">Correct Answer:</h4>
                            <div className="correct-answer-box">
                              <p className="correct-answer-text">
                                ✓ {fav.correctAnswer}
                              </p>
                            </div>
                          </div>

                          <div className="question-footer">
                            <button
                              onClick={() => handleViewExplanation(favorites.findIndex(f => f._id === fav._id))}
                              className="dash-btn dash-btn-primary"
                            >
                              View Explanation
                            </button>
                            <span className="question-date">
                              {new Date(fav.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Questions View for Selected Topic
              <div className="questions-grid">
                {groupedFavorites[selectedTopic].map((fav, index) => (
                  <div key={fav._id} className="question-card" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="question-header">
                      <div className="question-badges">
                        <span className={`question-type-badge ${
                          fav.type === 'mcq' ? 'mcq' : 
                          fav.type === 'essay' || fav.type === 'structured_essay' ? 'essay' : 'short'
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
                        className="favorite-star"
                        title="Remove from favorites"
                      >
                        ★
                      </button>
                    </div>

                    <div className="question-section">
                      <h3 className="question-label">Question:</h3>
                      <p className="question-text">{fav.question}</p>
                    </div>

                    {fav.type === 'mcq' && fav.options && fav.options.length > 0 && (
                      <div className="question-section">
                        <h4 className="question-label">Answer Options:</h4>
                        <div className="options-list">
                          {fav.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex} 
                              className={`option-item ${option === fav.correctAnswer ? 'correct' : 'normal'}`}
                            >
                              <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + optionIndex)}.</span> {option}
                              {option === fav.correctAnswer && <span style={{ marginLeft: '8px' }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="question-section">
                      <h4 className="question-label">Correct Answer:</h4>
                      <div className="correct-answer-box">
                        <p className="correct-answer-text">
                          ✓ {fav.correctAnswer}
                        </p>
                      </div>
                    </div>

                    <div className="question-footer">
                      <button
                        onClick={() => handleViewExplanation(favorites.findIndex(f => f._id === fav._id))}
                        className="dash-btn dash-btn-primary"
                      >
                        View Explanation
                      </button>
                      <span className="question-date">
                        {new Date(fav.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
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


