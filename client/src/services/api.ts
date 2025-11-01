import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Set up axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Documents API
export const documentsAPI = {
  upload: (formData: FormData) => axios.post('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Regenerate questions for a document with options
  regenerate: (
    documentId: string,
    options: { type: 'mcq'|'essay'|'structured_essay'|'mixed'; numQuestions?: number; coverAllTopics?: boolean }
  ) => axios.post(`/api/documents/${documentId}/regenerate`, options),

  regenerateOne: (
    documentId: string,
    index: number,
    options: { type?: 'mcq'|'essay'|'structured_essay'|'mixed'; coverAllTopics?: boolean }
  ) => axios.post(`/api/documents/${documentId}/regenerate-one`, { index, ...options }),
  summarize: (documentId: string) => axios.post(`/api/documents/${documentId}/summary`),
  
  getAll: () => axios.get('/api/documents'),
  
  getById: (id: string) => axios.get(`/api/documents/${id}`),
  
  delete: (id: string) => axios.delete(`/api/documents/${id}`)
};

// Quiz API
export const quizAPI = {
  getHistory: () => axios.get('/api/quiz/history'),
  
  getResult: (quizResultId: string) => axios.get(`/api/quiz/result/${quizResultId}`),
  
  getRevision: () => axios.get('/api/quiz/revision'),
  
  save: (quizResultId: string) => axios.post(`/api/quiz/save/${quizResultId}`),
  
  submit: (documentId: string, answers: string[]) =>
    axios.post('/api/quiz/submit', { documentId, answers }),
  
  getEnhancedExplanation: (question: string, correctAnswer: string, userAnswer: string, originalExplanation: string) =>
    axios.post('/api/quiz/explanation', { question, correctAnswer, userAnswer, originalExplanation }),

  gradeEssay: (correctAnswer: string, userAnswer: string) =>
    axios.post('/api/quiz/grade-essay', { correctAnswer, userAnswer }),

  deleteRevision: (quizResultId: string) =>
    axios.delete(`/api/quiz/delete-revision/${quizResultId}`),

  deleteQuiz: (quizResultId: string) => {
    console.log('🔗 API SERVICE: deleteQuiz called');
    console.log('🔗 API SERVICE: quizResultId:', quizResultId);
    console.log('🔗 API SERVICE: Making DELETE request to:', `/api/quiz/delete/${quizResultId}`);
    return axios.delete(`/api/quiz/delete/${quizResultId}`);
  }
};

// Favorites API
export const favoritesAPI = {
  list: () => axios.get('/api/favorites'),
  toggle: (payload: { 
    question: string; 
    correctAnswer: string; 
    explanation: string; 
    type?: string; 
    options?: string[];
    documentId?: string;
    documentTitle?: string;
  }) => axios.post('/api/favorites', payload),
  remove: (id: string) => axios.delete(`/api/favorites/${id}`)
};

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    axios.post('/api/auth/login', { email, password }),
  
  signup: (email: string, password: string) => 
    axios.post('/api/auth/register', { email, password }),
  
  guestLogin: () => axios.post('/api/auth/guest'),
  
  getMe: () => axios.get('/api/auth/me')
};

// Pricing API
export const pricingAPI = {
  getPlans: () => axios.get('/api/pricing/plans', {
    params: { _t: Date.now() }, // Cache-busting parameter
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  }),
  
  getPlan: (id: string) => axios.get(`/api/pricing/plans/${id}`, {
    params: { _t: Date.now() }, // Cache-busting parameter
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
};