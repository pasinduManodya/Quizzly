import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, favoritesAPI } from '../services/api';
import SummaryModal from '../components/SummaryModal';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';
import AILoading from '../components/AILoading';
import ProgressBar from '../components/ProgressBar';

interface Document {
  _id: string;
  title: string;
  filename: string;
  questions: any[];
  uploadedAt: string;
}

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Debug summaryText changes
  useEffect(() => {
    console.log('🔄 Dashboard summaryText changed:', typeof summaryText === 'string' ? summaryText.substring(0, 100) + '...' : 'Non-string summary');
  }, [summaryText]);
  const [generatingSummary, setGeneratingSummary] = useState<Record<string, boolean>>({});
  const [summaryProgress, setSummaryProgress] = useState<Record<string, number>>({});

  // Start Quiz setup modal state
  const [showSetup, setShowSetup] = useState(false);
  const [setupDocId, setSetupDocId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'essay' | 'structured_essay' | 'mixed'>('mcq');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [coverAllTopics, setCoverAllTopics] = useState<boolean>(false);
  const [startingQuiz, setStartingQuiz] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchFavorites();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const res = await favoritesAPI.list();
      setFavorites(res.data);
    } catch (e) {
      // ignore
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      const token = localStorage.getItem('token');
      
      return new Promise<void>((resolve, reject) => {
        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            setUploadProgress(Math.min(percentComplete, 95)); // Cap at 95% until complete
          }
        });

        // Handle completion
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            // Small delay to show 100%
            setTimeout(async () => {
              await fetchDocuments();
              setUploading(false);
              setUploadProgress(0);
              setUploadFileName('');
              resolve();
            }, 300);
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              setError(errorData.message || 'Upload failed');
            } catch {
              setError('Upload failed');
            }
            setUploading(false);
            setUploadProgress(0);
            setUploadFileName('');
            reject(new Error('Upload failed'));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          setError('Network error. Please check your connection.');
          setUploading(false);
          setUploadProgress(0);
          setUploadFileName('');
          reject(new Error('Network error'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          setUploading(false);
          setUploadProgress(0);
          setUploadFileName('');
          reject(new Error('Upload cancelled'));
        });

        // Open and send request
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        xhr.open('POST', `${apiUrl}/api/documents/upload`);
        
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        xhr.send(formData);
      });
    } catch (error: any) {
      setError(error.message || 'Upload failed');
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentsAPI.delete(documentId);
      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleStartQuiz = (documentId: string) => {
    setSetupDocId(documentId);
    setShowSetup(true);
  };

  const handleConfirmStart = async () => {
    if (!setupDocId) return;
    try {
      setStartingQuiz(true);
      // Call backend to regenerate questions with options
      try {
        await documentsAPI.regenerate(setupDocId, {
          type: questionType,
          coverAllTopics,
          numQuestions
        });
      } catch (e: any) {
        const msg = e?.response?.data?.message || 'Failed to generate quiz with selected options';
        setError(msg);
        return;
      }
      setShowSetup(false);
      navigate(`/quiz/${setupDocId}`);
    } finally {
      setStartingQuiz(false);
    }
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
      <header className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 sm:py-6">
            {/* Logo and Title Section */}
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <Logo className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover flex-shrink-0" size={40} />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Quizzly</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  <span className="hidden sm:inline">Welcome back, </span>
                  <span className="font-medium">{user?.isGuest ? 'Guest' : user?.email?.split('@')[0] || 'User'}</span>
                  {user?.isGuest && <span className="text-yellow-600 ml-1 sm:ml-2 text-xs">(Temp)</span>}
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
              <button
                onClick={() => navigate('/revision')}
                className="btn-secondary text-sm lg:text-base"
              >
                Revision
              </button>
              <button
                onClick={() => navigate('/favorites')}
                className="btn-accent text-sm lg:text-base"
              >
                Favorites
              </button>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded-lg shadow text-sm lg:text-base transition-colors"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex-shrink-0 ml-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!mobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 transition-all duration-200 ease-in-out">
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    navigate('/revision');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left btn-secondary text-sm"
                >
                  Revision History
                </button>
                <button
                  onClick={() => {
                    navigate('/favorites');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left btn-accent text-sm"
                >
                  Favorites
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow text-sm mt-2"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Upload Section */}
        <div className="px-4 py-6 sm:px-0">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-primary transition-colors duration-200 bg-white shadow-soft"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload a PDF document
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    Click to select a PDF file or drag and drop here (max 10MB)
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".pdf"
                  className="sr-only"
                  onChange={handleFileInputChange}
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <div className="mt-6 space-y-3">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        <span className="text-sm font-medium text-gray-700">Uploading...</span>
                      </div>
                      <span className="text-sm font-semibold text-blue-600">{Math.round(uploadProgress)}%</span>
                    </div>
                    <ProgressBar 
                      isActive={true} 
                      progress={uploadProgress}
                      variant="primary" 
                      className="w-full"
                      showPercentage={false}
                      animated={true}
                    />
                    <p className="mt-2 text-xs text-gray-500 truncate">{uploadFileName}</p>
                    {uploadProgress >= 95 && uploadProgress < 100 && (
                      <p className="mt-1 text-xs text-blue-600 animate-pulse">Processing PDF content...</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Documents</h2>
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No documents uploaded yet. Upload your first PDF to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc._id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {doc.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {doc.questions.length} questions generated
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-4 flex space-x-3">
              <button
                onClick={() => handleStartQuiz(doc._id)}
                className="flex-1 btn-primary text-sm font-medium"
              >
                        Start Quiz
                      </button>
                      <button
                        onClick={async () => {
                          if (generatingSummary[doc._id]) return;
                          
                          try {
                            setGeneratingSummary(prev => ({ ...prev, [doc._id]: true }));
                            setSummaryProgress(prev => ({ ...prev, [doc._id]: 0 }));
                            
                            // Simulate progress updates during API call
                            const progressInterval = setInterval(() => {
                              setSummaryProgress(prev => {
                                const current = prev[doc._id] || 0;
                                if (current >= 90) return prev; // Stop at 90% until API completes
                                return { ...prev, [doc._id]: current + Math.random() * 10 };
                              });
                            }, 200);
                            
                            const res = await documentsAPI.summarize(doc._id);
                            
                            // Complete the progress bar
                            clearInterval(progressInterval);
                            setSummaryProgress(prev => ({ ...prev, [doc._id]: 100 }));
                            
                            // Small delay to show 100% completion
                            setTimeout(() => {
                              setSelectedDocumentId(doc._id);
                              setSummaryTitle(doc.title);
                              setSummaryText(res.data.summary);
                              setSummaryOpen(true);
                              setGeneratingSummary(prev => ({ ...prev, [doc._id]: false }));
                              setSummaryProgress(prev => ({ ...prev, [doc._id]: 0 }));
                            }, 500);
                            
                          } catch (e: any) {
                            alert(e?.response?.data?.message || 'Failed to generate summary');
                            setGeneratingSummary(prev => ({ ...prev, [doc._id]: false }));
                            setSummaryProgress(prev => ({ ...prev, [doc._id]: 0 }));
                          }
                        }}
                        disabled={generatingSummary[doc._id]}
                        className="btn-secondary text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      >
                        {generatingSummary[doc._id] ? (
                          <div className="flex flex-col items-center space-y-2 w-full">
                            <div className="flex items-center space-x-2">
                              <LoadingSpinner size="sm" color="blue" />
                              <span>Generating...</span>
                            </div>
                            <ProgressBar 
                              isActive={true} 
                              progress={summaryProgress[doc._id] || 0}
                              variant="info" 
                              className="w-full"
                              showPercentage={true}
                              animated={true}
                            />
                          </div>
                        ) : (
                          'Create Summary'
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc._id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg shadow text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Favorites removed from Dashboard; now a dedicated page at /favorites */}

        {/* Start Quiz Setup Modal */}
        {showSetup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Quiz Setup</h3>
                  <button
                    onClick={() => setShowSetup(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="px-6 py-4 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="mcq">MCQ</option>
                    <option value="essay">Essay</option>
                    <option value="structured_essay">Structured Essay</option>
                    <option value="mixed">Mixed (combination of all)</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                    <input
                      type="number"
                      min={1}
                      value={numQuestions}
                      onChange={(e) => setNumQuestions(Math.max(1, Number(e.target.value)))}
                      disabled={coverAllTopics}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={coverAllTopics}
                        onChange={(e) => setCoverAllTopics(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">Cover all topics (ignore number)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                {startingQuiz ? (
                  <div className="flex justify-center py-8">
                    <AILoading text="Generating your personalized quiz..." />
                  </div>
                ) : (
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowSetup(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmStart}
                      disabled={startingQuiz}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-md"
                    >
                      Start Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Limit Info */}
        <div className="px-4 py-6 sm:px-0">
          <div className={`border rounded-md p-4 ${user?.isGuest ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className={`h-5 w-5 ${user?.isGuest ? 'text-yellow-400' : 'text-blue-400'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${user?.isGuest ? 'text-yellow-700' : 'text-blue-700'}`}>
                  {user?.isGuest 
                    ? `Guest session: You have uploaded ${documents.length} of ${user?.maxDocuments} PDFs. Data will be deleted when you leave.`
                    : `You have uploaded ${documents.length} of ${user?.maxDocuments} documents.`
                  }
                </p>
                {user?.isGuest && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Create an account to save your progress permanently.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <SummaryModal
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        title={summaryTitle}
        summary={summaryText}
        documentId={selectedDocumentId || undefined}
        onSimplifiedSummary={(newSummary) => {
          console.log('🔄 Simplified summary callback called with:', typeof newSummary === 'string' ? newSummary.substring(0, 100) + '...' : 'Non-string summary');
          console.log('🔄 Setting summaryText to:', typeof newSummary === 'string' ? newSummary.substring(0, 100) + '...' : 'Non-string summary');
          setSummaryText(newSummary);
          console.log('🔄 SummaryText state updated');
        }}
        onShorterSummary={(newSummary) => {
          console.log('🔄 Shorter summary callback called with:', typeof newSummary === 'string' ? newSummary.substring(0, 100) + '...' : 'Non-string summary');
          console.log('🔄 Setting summaryText to:', typeof newSummary === 'string' ? newSummary.substring(0, 100) + '...' : 'Non-string summary');
          setSummaryText(newSummary);
          console.log('🔄 SummaryText state updated');
        }}
      />
    </div>
  );
};

export default Dashboard;
