import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, favoritesAPI, modulesAPI } from '../services/api';
import SummaryModal from '../components/SummaryModal';
import Logo from '../components/Logo';
import LoadingSpinner from '../components/LoadingSpinner';
import AILoading from '../components/AILoading';
import ProgressBar from '../components/ProgressBar';
import { ModuleTree } from '../components/ModuleTree';
import { ModuleModal } from '../components/ModuleModal';
import { MoveDocumentModal } from '../components/MoveDocumentModal';
import Avatar from '../components/Avatar';
import '../styles/dashboard.css';

interface Module {
  _id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentModule?: string | null;
  children?: Module[];
  documents?: Array<{
    _id: string;
    title: string;
    filename: string;
    uploadedAt: string;
  }>;
  documentCount?: number;
}

interface Document {
  _id: string;
  title: string;
  filename: string;
  questions: any[];
  uploadedAt: string;
  condensedTextReady?: boolean;
  module?: {
    _id: string;
    name: string;
    color?: string;
    icon?: string;
  };
}

const Dashboard: React.FC = () => {
  const [documentsState, setDocumentsState] = useState<Document[]>([]);
  
  // Wrapper to track all setDocuments calls
  const setDocuments = useCallback((newDocuments: Document[] | ((prev: Document[]) => Document[])) => {
    const callId = `setDocs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stackTrace = new Error().stack;
    
    console.log(`🔴 [${callId}] setDocuments called`, {
      isFunction: typeof newDocuments === 'function',
      currentCount: documentsState.length,
      newCount: typeof newDocuments === 'function' ? 'function (will compute)' : (Array.isArray(newDocuments) ? newDocuments.length : 'unknown'),
      stackTrace: stackTrace?.split('\n').slice(0, 5).join('\n')
    });
    
    setDocumentsState((prev) => {
      const result = typeof newDocuments === 'function' ? newDocuments(prev) : newDocuments;
      console.log(`🔴 [${callId}] setDocuments state update:`, {
        prevCount: prev.length,
        newCount: Array.isArray(result) ? result.length : 'not array',
        result: Array.isArray(result) ? result.map((d: any) => ({ id: d._id || d.id, title: d.title })) : result
      });
      return result;
    });
  }, [documentsState.length]);
  
  // Alias for easier access
  const documents = documentsState;
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const uploadXHRRef = useRef<XMLHttpRequest | null>(null);
  const uploadProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadCompleteIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadCancelledRef = useRef<boolean>(false);
  const [, setFavorites] = useState<any[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryTitle, setSummaryTitle] = useState('');
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Debug: Track documents state changes
  useEffect(() => {
    console.log('🔍 [DEBUG] Documents state changed:', {
      count: documents.length,
      documents: documents.map(d => ({ id: d._id, title: d.title })),
      timestamp: new Date().toISOString()
    });
  }, [documents]);
  // Debug summaryText changes
  useEffect(() => {
    console.log('🔄 Dashboard summaryText changed:', typeof summaryText === 'string' ? summaryText.substring(0, 100) + '...' : 'Non-string summary');
  }, [summaryText]);
  const [generatingSummary, setGeneratingSummary] = useState<Record<string, boolean>>({});
  const [summaryProgress, setSummaryProgress] = useState<Record<string, number>>({});
  const summaryAbortControllersRef = useRef<Record<string, AbortController>>({});
  const summaryProgressIntervalsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Start Quiz setup modal state
  const [showSetup, setShowSetup] = useState(false);
  const [setupDocId, setSetupDocId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'essay' | 'structured_essay' | 'mixed'>('mcq');
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [coverAllTopics, setCoverAllTopics] = useState<boolean>(false);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [quizGenerationProgress, setQuizGenerationProgress] = useState(0);
  const quizProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Module-related state
  const [modules, setModules] = useState<Module[]>([]);
  const [flatModules, setFlatModules] = useState<Module[]>([]);
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [parentModuleForNew, setParentModuleForNew] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [movingDocument, setMovingDocument] = useState<Document | null>(null);
  const [draggedDocument, setDraggedDocument] = useState<Document | null>(null);
  const [dragOverModuleId, setDragOverModuleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'current' | 'all'>('current');
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const isInitialMount = useRef(true);
  const condensedTextPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const fetchModules = async () => {
    try {
      const [treeResponse, flatResponse] = await Promise.all([
        modulesAPI.getTree(),
        modulesAPI.getFlat()
      ]);
      setModules(treeResponse.data);
      setFlatModules(flatResponse.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };


  const fetchDocuments = useCallback(async (preserveOnError = false, moduleId?: string | null) => {
    const callId = `fetch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`🔵 [${callId}] fetchDocuments called`, { preserveOnError, moduleId, currentDocsCount: documents.length });
    
    try {
      console.log(`🔵 [${callId}] Calling documentsAPI.getAll()...`);
      const response = await documentsAPI.getAll();
      
      const documentsData = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
      
      // Store all documents for search and "view all" functionality
      setAllDocuments(documentsData);
      
      // Filter by current module if needed
      const filteredDocs = moduleId !== undefined
        ? documentsData.filter((doc: Document) => {
            const docModuleId = doc.module?._id || null;
            return docModuleId === moduleId;
          })
        : documentsData;
      
      console.log(`🔵 [${callId}] API Response received:`, {
        hasResponse: !!response,
        hasData: !!response?.data,
        dataType: typeof response?.data,
        isArray: Array.isArray(response?.data),
        rawData: response?.data,
        dataLength: Array.isArray(response?.data) ? response?.data.length : 'N/A'
      });
      
      console.log(`🔵 [${callId}] Processed documents data:`, {
        count: filteredDocs.length,
        isArray: Array.isArray(filteredDocs),
        documents: filteredDocs.map((d: any) => ({ id: d._id || d.id, title: d.title }))
      });
      
      console.log(`🔵 [${callId}] Current documents before setDocuments:`, documents.length);
      console.log(`🔵 [${callId}] Setting documents to:`, filteredDocs.length);
      
      setDocuments(filteredDocs);
      
      // Verify state was updated (use documentsState to avoid stale closure)
      setTimeout(() => {
        // Use a ref or check the actual state - but this is just for debugging
        console.log(`🔵 [${callId}] Documents state after setDocuments (async check) - note: may show stale value due to closure`);
      }, 100);
      
      console.log(`✅ [${callId}] fetchDocuments completed successfully`);
      return filteredDocs;
    } catch (error: any) {
      console.error(`❌ [${callId}] Error fetching documents:`, error);
      console.error(`❌ [${callId}] Error details:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        data: error.response?.data,
        stack: error.stack
      });
      
      // Don't clear documents on error if preserveOnError is true
      if (!preserveOnError) {
        console.warn(`⚠️ [${callId}] Clearing documents due to error (preserveOnError=false)`);
        setDocuments([]);
      } else {
        console.log(`✅ [${callId}] Preserving existing documents (preserveOnError=true), current count:`, documents.length);
      }
      
      if (error.response?.status === 401) {
        // If unauthorized, might need to re-authenticate
        console.warn(`⚠️ [${callId}] Unauthorized - might need to refresh token`);
      }
      throw error; // Re-throw to allow retry logic
    } finally {
      setLoading(false);
      console.log(`🔵 [${callId}] fetchDocuments finally block - loading set to false`);
    }
  }, [documents.length, setDocuments]);

  const fetchFavorites = async () => {
    try {
      const res = await favoritesAPI.list();
      setFavorites(res.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    console.log('🟡 [MOUNT] Dashboard useEffect called', { isInitialMount: isInitialMount.current });
    
    if (isInitialMount.current) {
      console.log('🟡 [MOUNT] Initial mount - fetching documents and modules');
      isInitialMount.current = false;
      setLoading(true);
      
      Promise.all([
        fetchDocuments(false),
        fetchFavorites(),
        fetchModules()
      ])
        .then(() => {
          console.log('🟡 [MOUNT] Initial data fetch completed');
          setLoading(false);
        })
        .catch((error) => {
          console.error('🟡 [MOUNT] Error during initial data fetch:', error);
          setLoading(false);
        });
    } else {
      console.log('🟡 [MOUNT] Re-render detected - NOT fetching documents again');
    }
    
    return () => {
      console.log('🟡 [UNMOUNT] Dashboard cleanup called');
      if (uploadXHRRef.current) {
        uploadXHRRef.current.abort();
        uploadXHRRef.current = null;
      }
      if (uploadProgressIntervalRef.current) {
        clearInterval(uploadProgressIntervalRef.current);
        uploadProgressIntervalRef.current = null;
      }
      if (uploadCompleteIntervalRef.current) {
        clearInterval(uploadCompleteIntervalRef.current);
        uploadCompleteIntervalRef.current = null;
      }
      if (condensedTextPollIntervalRef.current) {
        clearInterval(condensedTextPollIntervalRef.current);
        condensedTextPollIntervalRef.current = null;
      }
    };
  }, [fetchDocuments]);
  
  useEffect(() => {
    const hasUnreadyDocuments = documents.some(doc => !doc.condensedTextReady);
    
    if (hasUnreadyDocuments) {
      if (condensedTextPollIntervalRef.current) {
        clearInterval(condensedTextPollIntervalRef.current);
      }
      condensedTextPollIntervalRef.current = setInterval(() => {
        fetchDocuments(true);
      }, 3000) as NodeJS.Timeout;
    } else {
      if (condensedTextPollIntervalRef.current) {
        clearInterval(condensedTextPollIntervalRef.current);
        condensedTextPollIntervalRef.current = null;
      }
    }
    
    return () => {
      if (condensedTextPollIntervalRef.current) {
        clearInterval(condensedTextPollIntervalRef.current);
        condensedTextPollIntervalRef.current = null;
      }
    };
  }, [documents, fetchDocuments]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      window.history.pushState(null, '', window.location.pathname);
      setShowLogoutConfirm(true);
    };

    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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
    uploadCancelledRef.current = false; // Reset cancellation flag

    // Clear any existing intervals
    if (uploadProgressIntervalRef.current) {
      clearInterval(uploadProgressIntervalRef.current);
      uploadProgressIntervalRef.current = null;
    }
    if (uploadCompleteIntervalRef.current) {
      clearInterval(uploadCompleteIntervalRef.current);
      uploadCompleteIntervalRef.current = null;
    }

    // Use refs to track progress to avoid closure issues
    const progressState = { smoothProgress: 0 };

    // Smooth progress animation that starts immediately
    uploadProgressIntervalRef.current = setInterval(() => {
      progressState.smoothProgress += 0.5; // Slow increment of 0.5% per interval
      if (progressState.smoothProgress < 90) { // Gradually increase to 90%
        setUploadProgress(Math.min(progressState.smoothProgress, 90));
      } else {
        if (uploadProgressIntervalRef.current) {
          clearInterval(uploadProgressIntervalRef.current);
          uploadProgressIntervalRef.current = null;
        }
      }
    }, 100) as NodeJS.Timeout; // Update every 100ms for smooth animation

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();
      uploadXHRRef.current = xhr; // Store XHR reference for cancellation
      const token = localStorage.getItem('token');
      let actualUploadProgress = 0;
      
      return new Promise<void>((resolve, reject) => {
        // Track actual upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            actualUploadProgress = (e.loaded / e.total) * 80; // Map to 0-80% for upload
            // Smoothly update progress, using actual progress but keep it gradual
            if (actualUploadProgress > progressState.smoothProgress) {
              progressState.smoothProgress = actualUploadProgress;
              setUploadProgress(Math.min(progressState.smoothProgress, 85));
            }
          }
        });

        // Handle completion
        xhr.addEventListener('load', async () => {
          if (uploadProgressIntervalRef.current) {
            clearInterval(uploadProgressIntervalRef.current);
            uploadProgressIntervalRef.current = null;
          }
          
          if (xhr.status >= 200 && xhr.status < 300) {
            // Smoothly animate from current progress to 100%
            const currentProgress = progressState.smoothProgress;
            const targetProgress = 100;
            const steps = 20; // Number of steps for smooth completion
            const increment = (targetProgress - currentProgress) / steps;
            let stepProgress = currentProgress;
            
            uploadCompleteIntervalRef.current = setInterval(() => {
              stepProgress += increment;
              if (stepProgress >= 100) {
                stepProgress = 100;
                if (uploadCompleteIntervalRef.current) {
                  clearInterval(uploadCompleteIntervalRef.current);
                  uploadCompleteIntervalRef.current = null;
                }
                setUploadProgress(100);
                console.log('🟢 Upload progress reached 100%, starting document refresh...');
                console.log('🟢 Current documents count before refresh:', documents.length);
                
                // Show 100% for a moment before completing
                setTimeout(async () => {
                  const refreshId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  console.log(`🟢 [${refreshId}] Starting document refresh after upload`);
                  
                  try {
                    // Add a small delay to ensure backend has saved the document
                    console.log(`🟢 [${refreshId}] Waiting 500ms for backend to save...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Fetch documents with retry logic
                    let retries = 3;
                    let success = false;
                    console.log(`🟢 [${refreshId}] Starting retry loop, max retries: ${retries}`);
                    
                    while (retries > 0 && !success) {
                      const attemptNum = 4 - retries;
                      console.log(`🟢 [${refreshId}] Attempt ${attemptNum}/${3} to fetch documents...`);
                      console.log(`🟢 [${refreshId}] Current documents before fetch:`, documents.length);
                      
                      try {
                        // Use preserveOnError=true to keep existing documents if fetch fails
                        const fetchedDocs = await fetchDocuments(true);
                        success = true;
                        console.log(`✅ [${refreshId}] Documents refreshed successfully! Count:`, fetchedDocs?.length || 0);
                        console.log(`✅ [${refreshId}] Documents after fetch:`, documents.length);
                      } catch (error: any) {
                        retries--;
                        console.warn(`⚠️ [${refreshId}] Attempt ${attemptNum} failed:`, {
                          error: error.message,
                          status: error.response?.status,
                          retriesLeft: retries
                        });
                        
                        if (retries > 0) {
                          console.log(`🟢 [${refreshId}] Waiting 500ms before retry...`);
                          await new Promise(resolve => setTimeout(resolve, 500));
                        } else {
                          // Last retry failed - log but don't clear documents
                          console.error(`❌ [${refreshId}] All retries failed, keeping existing documents`);
                          console.error(`❌ [${refreshId}] Current documents count:`, documents.length);
                        }
                      }
                    }
                    
                    // Final check
                    console.log(`🟢 [${refreshId}] Refresh complete. Final documents count:`, documents.length);
                  } catch (error: any) {
                    console.error(`❌ [${refreshId}] Error refreshing documents after upload:`, error);
                    console.error(`❌ [${refreshId}] Error stack:`, error.stack);
                    console.error(`❌ [${refreshId}] Current documents count:`, documents.length);
                    // Still complete the upload even if fetch fails
                  } finally {
                    console.log(`🟢 [${refreshId}] Cleaning up upload state...`);
                    setUploading(false);
                    setUploadProgress(0);
                    setUploadFileName('');
                    uploadXHRRef.current = null;
                    console.log(`🟢 [${refreshId}] Upload cleanup complete. Documents count:`, documents.length);
                    resolve();
                  }
                }, 500);
              } else {
                setUploadProgress(stepProgress);
              }
            }, 50) as NodeJS.Timeout; // Update every 50ms for smooth completion animation
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              setError(errorData.message || 'Upload failed');
            } catch {
              setError('Upload failed');
            }
            if (uploadProgressIntervalRef.current) {
              clearInterval(uploadProgressIntervalRef.current);
              uploadProgressIntervalRef.current = null;
            }
            if (uploadCompleteIntervalRef.current) {
              clearInterval(uploadCompleteIntervalRef.current);
              uploadCompleteIntervalRef.current = null;
            }
            setUploading(false);
            setUploadProgress(0);
            setUploadFileName('');
            uploadXHRRef.current = null;
            reject(new Error('Upload failed'));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          if (uploadProgressIntervalRef.current) {
            clearInterval(uploadProgressIntervalRef.current);
            uploadProgressIntervalRef.current = null;
          }
          if (uploadCompleteIntervalRef.current) {
            clearInterval(uploadCompleteIntervalRef.current);
            uploadCompleteIntervalRef.current = null;
          }
          setError('Network error. Please check your connection.');
          setUploading(false);
          setUploadProgress(0);
          setUploadFileName('');
          uploadXHRRef.current = null;
          reject(new Error('Network error'));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          if (uploadProgressIntervalRef.current) {
            clearInterval(uploadProgressIntervalRef.current);
            uploadProgressIntervalRef.current = null;
          }
          if (uploadCompleteIntervalRef.current) {
            clearInterval(uploadCompleteIntervalRef.current);
            uploadCompleteIntervalRef.current = null;
          }
          setUploading(false);
          setUploadProgress(0);
          setUploadFileName('');
          uploadXHRRef.current = null;
          
          // If cancellation was intentional, don't reject (to avoid unhandled promise rejection)
          if (uploadCancelledRef.current) {
            setError('Upload cancelled by user');
            uploadCancelledRef.current = false;
            resolve(); // Resolve instead of reject for intentional cancellation
          } else {
            setError('Upload cancelled');
            reject(new Error('Upload cancelled'));
          }
        });

        // Open and send request
        // Use relative path for same-origin requests (no localhost fallback to avoid local network prompt)
        const apiUrl = process.env.REACT_APP_API_URL || '';
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
      uploadXHRRef.current = null;
      if (uploadProgressIntervalRef.current) {
        clearInterval(uploadProgressIntervalRef.current);
        uploadProgressIntervalRef.current = null;
      }
      if (uploadCompleteIntervalRef.current) {
        clearInterval(uploadCompleteIntervalRef.current);
        uploadCompleteIntervalRef.current = null;
      }
    }
  };

  const handleCancelUpload = () => {
    // Mark that cancellation is intentional
    uploadCancelledRef.current = true;
    
    if (uploadXHRRef.current) {
      uploadXHRRef.current.abort();
      // Don't set to null here, let the abort handler do the cleanup
    }
    
    // Also clean up intervals immediately for better UX
    if (uploadProgressIntervalRef.current) {
      clearInterval(uploadProgressIntervalRef.current);
      uploadProgressIntervalRef.current = null;
    }
    
    if (uploadCompleteIntervalRef.current) {
      clearInterval(uploadCompleteIntervalRef.current);
      uploadCompleteIntervalRef.current = null;
    }
    
    // UI updates can happen here, but the abort handler will also handle cleanup
    setError('Cancelling upload...');
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await handleFileUpload(file);
      } catch (error: any) {
        // Silently handle cancellation errors - they're already handled in the abort listener
        if (error.message !== 'Upload cancelled' && error.message !== 'Upload cancelled by user') {
          console.error('Upload error:', error);
        }
      }
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
      setQuizGenerationProgress(0);
      
      // Simulate progress updates during quiz generation
      quizProgressIntervalRef.current = setInterval(() => {
        setQuizGenerationProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until API completes
          return prev + Math.random() * 8;
        });
      }, 200) as NodeJS.Timeout;
      
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
        
        // Clear progress interval on error
        if (quizProgressIntervalRef.current) {
          clearInterval(quizProgressIntervalRef.current);
          quizProgressIntervalRef.current = null;
        }
        setQuizGenerationProgress(0);
        return;
      }
      
      // Complete the progress bar
      if (quizProgressIntervalRef.current) {
        clearInterval(quizProgressIntervalRef.current);
        quizProgressIntervalRef.current = null;
      }
      setQuizGenerationProgress(100);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setShowSetup(false);
        setQuizGenerationProgress(0);
        navigate(`/quiz/${setupDocId}`);
      }, 500);
    } finally {
      setStartingQuiz(false);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/');
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Module management handlers
  const handleModuleClick = (moduleId: string | null) => {
    setCurrentModuleId(moduleId);
    setViewMode('current');
    setSearchQuery('');
    fetchDocuments(false, moduleId);
  };

  const handleCreateModule = (parentId: string | null) => {
    setParentModuleForNew(parentId);
    setEditingModule(null);
    setError('');
    setShowModuleModal(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setParentModuleForNew(null);
    setShowModuleModal(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!window.confirm('Are you sure you want to delete this module? Documents will be moved to root.')) {
      return;
    }
    try {
      await modulesAPI.delete(moduleId);
      await fetchModules();
      await fetchDocuments(false, currentModuleId);
    } catch (error) {
      console.error('Error deleting module:', error);
      setError('Failed to delete module');
    }
  };

  const handleSaveModule = async (data: { name: string; description?: string; color?: string; parentModule?: string | null }) => {
    try {
      setError('');
      if (editingModule) {
        await modulesAPI.update(editingModule._id, data);
      } else {
        await modulesAPI.create({
          ...data,
          parentModule: parentModuleForNew
        });
      }
      await fetchModules();
      setShowModuleModal(false);
      setEditingModule(null);
      setParentModuleForNew(null);
    } catch (error: any) {
      console.error('Error saving module:', error);
      setError(error.response?.data?.message || 'Failed to save module');
    }
  };

  const handleViewAllDocuments = () => {
    setViewMode('all');
    setCurrentModuleId(null);
    setSearchQuery('');
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setViewMode('all');
    }
  };

  // Drag and drop handlers
  const handleDocumentDragStart = (doc: Document) => {
    setDraggedDocument(doc);
  };

  const handleDocumentDragEnd = () => {
    setDraggedDocument(null);
    setDragOverModuleId(null);
  };

  const handleModuleDragOver = (e: React.DragEvent, moduleId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverModuleId(moduleId);
  };

  const handleModuleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverModuleId(null);
  };

  const handleModuleDrop = async (e: React.DragEvent, moduleId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverModuleId(null);

    if (!draggedDocument) return;

    try {
      await modulesAPI.moveDocument(moduleId, draggedDocument._id);
      await fetchModules();
      await fetchDocuments(false, currentModuleId);
      setDraggedDocument(null);
    } catch (error) {
      console.error('Error moving document:', error);
      setError('Failed to move document');
    }
  };

  // Move document modal handlers
  const handleMoveDocument = (doc: Document) => {
    setMovingDocument(doc);
    setShowMoveModal(true);
  };

  const handleConfirmMove = async (targetModuleId: string | null) => {
    if (!movingDocument) return;

    try {
      await modulesAPI.moveDocument(targetModuleId, movingDocument._id);
      await fetchModules();
      await fetchDocuments(false, currentModuleId);
      setShowMoveModal(false);
      setMovingDocument(null);
    } catch (error) {
      console.error('Error moving document:', error);
      setError('Failed to move document');
    }
  };

  const handleCancelSummary = (docId: string) => {
    console.log('🛑 Cancel Summary clicked for docId:', docId);
    console.log('🛑 Abort controllers:', Object.keys(summaryAbortControllersRef.current));
    console.log('🛑 Progress intervals:', Object.keys(summaryProgressIntervalsRef.current));
    
    // Abort the fetch request
    if (summaryAbortControllersRef.current[docId]) {
      console.log('🛑 Aborting fetch request');
      summaryAbortControllersRef.current[docId].abort();
      delete summaryAbortControllersRef.current[docId];
    } else {
      console.log('🛑 No abort controller found for docId:', docId);
    }

    // Clear the progress interval
    if (summaryProgressIntervalsRef.current[docId]) {
      console.log('🛑 Clearing progress interval');
      clearInterval(summaryProgressIntervalsRef.current[docId]);
      delete summaryProgressIntervalsRef.current[docId];
    } else {
      console.log('🛑 No progress interval found for docId:', docId);
    }

    // Reset UI state
    console.log('🛑 Resetting UI state');
    setGeneratingSummary(prev => ({ ...prev, [docId]: false }));
    setSummaryProgress(prev => ({ ...prev, [docId]: 0 }));
    setError('Summary generation cancelled');
  };

  if (loading) {
    return (
      <div className="dashboard-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', border: '3px solid #4361ee', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
          <p style={{ fontSize: '1rem', color: '#4a4a6a', fontFamily: 'Outfit, sans-serif' }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-inner">
          {/* User Profile Section */}
          <div className="header-brand">
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/profile')}
            >
              <Avatar
                avatarId={user?.avatar || 'avatar-1'}
                firstName={user?.firstName}
                lastName={user?.lastName}
                email={user?.email}
                size="md"
              />
              <div>
                <p className="font-semibold text-gray-900 text-lg">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || user?.email?.split('@')[0] || 'User'
                  }
                </p>
                {user?.isGuest && (
                  <span className="text-xs text-amber-600 font-medium">(Guest)</span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="header-actions">
            <button
              onClick={() => navigate('/revision')}
              className="dash-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Revision
            </button>
            <button
              onClick={() => navigate('/favorites')}
              className="dash-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Favorites
            </button>
            <button
              onClick={logout}
              className="dash-btn dash-btn-danger"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="mobile-menu-btn"
            aria-expanded={mobileMenuOpen}
          >
            <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>Open main menu</span>
            {!mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid rgba(20,20,40,0.08)', padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="dash-btn" style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              My Profile
            </button>
            <button
              onClick={() => {
                navigate('/revision');
                setMobileMenuOpen(false);
              }}
              className="dash-btn" style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              Revision History
            </button>
            <button
              onClick={() => {
                navigate('/favorites');
                setMobileMenuOpen(false);
              }}
              className="dash-btn" style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              Favorites
            </button>
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="dash-btn dash-btn-danger" style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="dashboard-main">
        {/* Module Tree and Content Grid */}
        <div className="dashboard-content-wrapper" style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', marginBottom: '32px' }}>
          {/* Desktop Sidebar */}
          <div className="desktop-sidebar">
            <ModuleTree
              modules={modules}
              currentModuleId={currentModuleId}
              onModuleClick={handleModuleClick}
              onCreateModule={handleCreateModule}
              onEditModule={handleEditModule}
              onDeleteModule={handleDeleteModule}
              onModuleDragOver={handleModuleDragOver}
              onModuleDragLeave={handleModuleDragLeave}
              onModuleDrop={handleModuleDrop}
              dragOverModuleId={dragOverModuleId}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onViewAllDocuments={handleViewAllDocuments}
              viewMode={viewMode}
            />
          </div>

          <div>
        {/* Upload Section */}
        <div className="upload-section">
          <div 
            className="upload-card"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <h3 className="upload-title">Upload Your Document</h3>
            <p className="upload-subtitle">Drop your PDF here or click to browse (max 10MB)</p>
            <label htmlFor="file-upload" className="dash-btn dash-btn-primary" style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              Choose File
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".pdf"
              className="upload-input"
              onChange={handleFileInputChange}
              disabled={uploading}
            />
            {uploading && (
              <div className="upload-progress">
                <div className="progress-header">
                  <div className="progress-info">
                    <div className="progress-spinner"></div>
                    <span className="progress-text">Uploading...</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="progress-percent">{Math.round(uploadProgress)}%</span>
                    <button
                      onClick={handleCancelUpload}
                      className="dash-btn dash-btn-danger" style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
                      title="Cancel upload"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                <div className="progress-bar-container">
                  <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="progress-filename">{uploadFileName}</p>
                {uploadProgress >= 95 && uploadProgress < 100 && (
                  <p style={{ marginTop: '8px', fontSize: '0.8125rem', color: '#4361ee', fontWeight: 600 }}>Processing PDF content...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ marginBottom: '32px', padding: '16px 20px', background: '#fef2f2', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: '12px', color: '#dc2626', fontSize: '0.9375rem' }}>
            {error}
          </div>
        )}

        {/* Documents List */}
        <div>
          <div className="section-header">
            <h2 className="section-title">Your Documents</h2>
            <p className="section-subtitle">{documents.length} {documents.length === 1 ? 'document' : 'documents'} ready for learning</p>
          </div>
          {documents.length === 0 ? (
            <div className="empty-state">
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <h3 className="empty-title">No documents yet</h3>
              <p className="empty-text">Upload your first PDF to start creating quizzes and summaries</p>
            </div>
          ) : (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div 
                  key={doc._id} 
                  className="doc-card"
                  draggable
                  onDragStart={() => handleDocumentDragStart(doc)}
                  onDragEnd={handleDocumentDragEnd}
                >
                  <div className="doc-header">
                    <h3 className="doc-title">{doc.title}</h3>
                    <div className="doc-meta">
                      <span>{doc.questions.length} questions generated</span>
                      <span>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!doc.condensedTextReady && (
                    <div className="doc-processing">
                      <div className="processing-content">
                        <div className="processing-spinner"></div>
                        <p className="processing-text">Processing document...</p>
                      </div>
                      <p className="processing-note">This may take a minute. Features will unlock when ready.</p>
                    </div>
                  )}
                  <div className="doc-actions">
                    <button
                      onClick={() => handleStartQuiz(doc._id)}
                      disabled={!doc.condensedTextReady}
                      className="doc-btn doc-btn-primary"
                      title={!doc.condensedTextReady ? 'Document is still being processed. Please wait...' : 'Start Quiz'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Start Quiz
                    </button>
                    <button
                      onClick={() => {
                        if (!doc.condensedTextReady) return;
                        navigate(`/summary/${doc._id}`);
                      }}
                      disabled={!doc.condensedTextReady}
                      className="doc-btn doc-btn-secondary"
                      title={!doc.condensedTextReady ? 'Document is still being processed. Please wait...' : 'View Summary'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Summary
                    </button>
                    <button
                      onClick={() => handleMoveDocument(doc)}
                      className="doc-btn doc-btn-secondary"
                      title="Move to Folder"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      Move
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc._id)}
                      disabled={!doc.condensedTextReady}
                      className="doc-btn doc-btn-delete"
                      title={!doc.condensedTextReady ? 'Document is still being processed. Please wait...' : 'Delete Document'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Quiz Setup Modal */}
        {showSetup && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Quiz Setup</h3>
                <button onClick={() => setShowSetup(false)} className="modal-close">×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Question Type</label>
                  <select value={questionType} onChange={(e) => setQuestionType(e.target.value as any)} className="form-select">
                    <option value="mcq">MCQ</option>
                    <option value="essay">Essay</option>
                    <option value="structured_essay">Structured Essay</option>
                    <option value="mixed">Mixed (combination of all)</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Number of Questions</label>
                    <input type="number" min={1} value={numQuestions} onChange={(e) => setNumQuestions(Math.max(1, Number(e.target.value)))} disabled={coverAllTopics} className="form-input" />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <label className="form-checkbox">
                      <input type="checkbox" checked={coverAllTopics} onChange={(e) => setCoverAllTopics(e.target.checked)} />
                      <span>Cover all topics</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {startingQuiz ? (
                  <div style={{ width: '100%', padding: '24px 0' }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                      <AILoading text="Generating your personalized quiz..." />
                    </div>
                    <div style={{ padding: '0 32px' }}>
                      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4a4a6a' }}>Progress</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#4361ee' }}>{Math.round(quizGenerationProgress)}%</span>
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${quizGenerationProgress}%` }}></div>
                      </div>
                      <p style={{ marginTop: '12px', fontSize: '0.8125rem', color: '#8888aa', textAlign: 'center' }}>
                        {quizGenerationProgress < 30 && 'Analyzing document content...'}
                        {quizGenerationProgress >= 30 && quizGenerationProgress < 60 && 'Generating questions...'}
                        {quizGenerationProgress >= 60 && quizGenerationProgress < 90 && 'Optimizing quiz structure...'}
                        {quizGenerationProgress >= 90 && 'Finalizing your quiz...'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setShowSetup(false)} className="dash-btn">Cancel</button>
                    <button onClick={handleConfirmStart} disabled={startingQuiz} className="dash-btn dash-btn-primary">Start Quiz</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Document Limit Info */}
        <div className={`info-banner ${user?.isGuest ? 'guest' : ''}`}>
          <svg className="info-icon" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="info-content">
            <p className="info-text">
              {user?.isGuest 
                ? `Guest session: You have uploaded ${documents.length} of ${user?.maxDocuments} PDFs. Data will be deleted when you leave.`
                : `You have uploaded ${documents.length} of ${user?.maxDocuments} documents.`
              }
            </p>
            {user?.isGuest && (
              <p className="info-subtext">Create an account to save your progress permanently.</p>
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

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', margin: '0 auto 20px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: '32px', height: '32px', color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="modal-title" style={{ marginBottom: '12px' }}>Confirm Logout</h3>
              <p style={{ fontSize: '1rem', color: '#4a4a6a', lineHeight: '1.6', marginBottom: '32px' }}>
                {user?.isGuest 
                  ? "Are you sure you want to leave? All your uploaded documents and progress will be permanently deleted."
                  : "Are you sure you want to logout and return to the home page?"
                }
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={handleCancelLogout} className="dash-btn" style={{ flex: 1, padding: '14px' }}>Stay</button>
                <button onClick={handleConfirmLogout} className="dash-btn dash-btn-danger" style={{ flex: 1, padding: '14px' }}>
                  {user?.isGuest ? "Leave & Delete" : "Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Module Modal */}
      <ModuleModal
        isOpen={showModuleModal}
        onClose={() => {
          setShowModuleModal(false);
          setEditingModule(null);
          setParentModuleForNew(null);
        }}
        onSave={handleSaveModule}
        module={editingModule}
        parentModuleId={parentModuleForNew}
        allModules={flatModules}
      />

      {/* Move Document Modal */}
      <MoveDocumentModal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setMovingDocument(null);
        }}
        onMove={handleConfirmMove}
        modules={modules}
        documentTitle={movingDocument?.title || ''}
        currentModuleId={movingDocument?.module?._id || null}
      />
    </div>
  );
};

export default Dashboard;
