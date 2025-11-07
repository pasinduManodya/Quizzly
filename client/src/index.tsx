import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Import API service early to ensure axios interceptors are set up before any requests
import './services/api';
import App from './App';

// Ensure any previously set dark mode is cleared
try {
  document.documentElement.classList.remove('dark');
  localStorage.removeItem('theme');
} catch {}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // Temporarily disabled StrictMode to prevent double renders
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
