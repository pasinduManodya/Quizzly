import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { registerServiceWorker } from './utils/pwa';
import PWAStatusIndicator from './components/PWAStatusIndicator';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/DashboardWithModules';
import Quiz from './pages/Quiz';
import ResultSheet from './pages/ResultSheet';
import Revision from './pages/Revision';
import Favorites from './pages/Favorites';
import SummaryPage from './pages/SummaryPage';
import Profile from './pages/Profile';
import ProfileSearch from './pages/ProfileSearch';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import About from './pages/About';
import Contact from './pages/Contact';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Landing from './pages/Landing';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Register service worker for PWA functionality
    registerServiceWorker();
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <PWAStatusIndicator />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/login/admin" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/about" element={<About />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route 
              path="/admin" 
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              } 
            />
            <Route path="/" element={<Landing />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/quiz/:documentId" 
              element={
                <ProtectedRoute>
                  <Quiz />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/summary/:documentId" 
              element={
                <ProtectedRoute>
                  <SummaryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/results/:quizResultId" 
              element={
                <ProtectedRoute>
                  <ResultSheet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/revision" 
              element={
                <ProtectedRoute>
                  <Revision />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/favorites" 
              element={
                <ProtectedRoute>
                  <Favorites />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:username" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <ProfileSearch />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
