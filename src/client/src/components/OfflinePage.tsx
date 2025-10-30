import React from 'react';

const OfflinePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-violet-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>
        
        <p className="text-gray-600 mb-6">
          Don't worry! You can still access your cached content and continue studying.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-teal-500 to-violet-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            🔄 Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full bg-white text-gray-700 py-3 rounded-xl font-semibold border-2 border-teal-200 hover:border-teal-400 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            ← Go Back
          </button>
        </div>
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">
            💡 <strong>Tip:</strong> Some features may be limited while offline. 
            Your progress is automatically saved when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;
