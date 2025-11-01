import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';

interface SummaryModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  summary: string | null | undefined;
  documentId?: string;
  onSimplifiedSummary?: (summary: string) => void;
  onShorterSummary?: (summary: string) => void;
}

// Function to parse markdown-like formatting
const parseFormattedText = (text: string) => {
  const lines = text.split('\n');
  const elements: JSX.Element[] = [];

  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      elements.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Handle headers (###)
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${lineIndex}`} className="text-lg font-bold text-blue-800 mt-4 mb-2 border-l-4 border-blue-500 pl-3">
          {line.replace('### ', '')}
        </h3>
      );
      return;
    }

    // Handle blockquotes (>)
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`} className="bg-blue-50 border-l-4 border-blue-400 p-3 my-2 italic text-blue-800">
          {line.replace('> ', '')}
        </blockquote>
      );
      return;
    }

    // Handle bullet points (-)
    if (line.startsWith('- ')) {
      elements.push(
        <div key={`bullet-${lineIndex}`} className="flex items-start mb-1 ml-4">
          <span className="text-blue-600 font-bold mr-2">•</span>
          <span className="text-gray-800">{parseInlineFormatting(line.replace('- ', ''))}</span>
        </div>
      );
      return;
    }

    // Handle numbered lists (1.)
    if (/^\d+\.\s/.test(line)) {
      elements.push(
        <div key={`numbered-${lineIndex}`} className="flex items-start mb-1 ml-4">
          <span className="text-blue-600 font-bold mr-2">{line.match(/^\d+/)?.[0]}.</span>
          <span className="text-gray-800">{parseInlineFormatting(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${lineIndex}`} className="text-gray-800 mb-2 leading-relaxed">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  return elements;
};

// Function to parse inline formatting (bold, italic, code)
const parseInlineFormatting = (text: string): (string | JSX.Element)[] => {
  const elements: (string | JSX.Element)[] = [];
  let key = 0;

  // Split by code blocks first
  const codeSplit = text.split(/`([^`]+)`/);
  
  codeSplit.forEach((part, index) => {
    if (index % 2 === 1) {
      // This is a code block
      elements.push(
        <code key={`code-${key++}`} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">
          {part}
        </code>
      );
    } else {
      // This is regular text, parse bold and italic
      const boldSplit = part.split(/\*\*([^*]+)\*\*/);
      boldSplit.forEach((boldPart, boldIndex) => {
        if (boldIndex % 2 === 1) {
          // This is bold text
          elements.push(
            <strong key={`bold-${key++}`} className="font-bold text-gray-900">
              {boldPart}
            </strong>
          );
        } else {
          // This is regular text, parse italic
          const italicSplit = boldPart.split(/\*([^*]+)\*/);
          italicSplit.forEach((italicPart, italicIndex) => {
            if (italicIndex % 2 === 1) {
              // This is italic text
              elements.push(
                <em key={`italic-${key++}`} className="italic text-gray-700">
                  {italicPart}
                </em>
              );
            } else {
              // This is regular text
              elements.push(italicPart);
            }
          });
        }
      });
    }
  });

  return elements;
};

// Length Selection Modal Component
const LengthSelectionModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onSelectLength: (length: 'short' | 'medium' | 'long') => void;
}> = ({ open, onClose, onSelectLength }) => {
  console.log('🔍 LengthSelectionModal render - open:', open);
  console.log('🔍 LengthSelectionModal props - onClose:', !!onClose);
  console.log('🔍 LengthSelectionModal props - onSelectLength:', !!onSelectLength);
  
  if (!open) {
    console.log('🔍 LengthSelectionModal not rendering because open is false');
    return null;
  }
  
  console.log('🔍 LengthSelectionModal rendering modal');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Choose Summary Length</h3>
            <button 
              onClick={onClose} 
              className="text-white hover:text-gray-200 text-2xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-700 mb-6">How short would you like the summary to be?</p>
          <div className="space-y-3">
            <button
              onClick={() => {
                console.log('🔄 Short length selected');
                onSelectLength('short');
              }}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-semibold text-gray-900">Short</div>
              <div className="text-sm text-gray-600">About 25% of original length</div>
            </button>
            <button
              onClick={() => {
                console.log('🔄 Medium length selected');
                onSelectLength('medium');
              }}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-semibold text-gray-900">Medium</div>
              <div className="text-sm text-gray-600">About 50% of original length</div>
            </button>
            <button
              onClick={() => {
                console.log('🔄 Long length selected');
                onSelectLength('long');
              }}
              className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
            >
              <div className="font-semibold text-gray-900">Long</div>
              <div className="text-sm text-gray-600">About 75% of original length</div>
            </button>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose} 
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryModal: React.FC<SummaryModalProps> = ({ 
  open, 
  onClose, 
  title = 'Document Summary', 
  summary, 
  documentId,
  onSimplifiedSummary,
  onShorterSummary 
}) => {
  const [showLengthModal, setShowLengthModal] = useState(false);
  const [isGeneratingSimplified, setIsGeneratingSimplified] = useState(false);
  const [isGeneratingShorter, setIsGeneratingShorter] = useState(false);
  const [simplifiedProgress, setSimplifiedProgress] = useState(0);
  const [shorterProgress, setShorterProgress] = useState(0);

  // Debug showLengthModal state changes
  useEffect(() => {
    console.log('🔍 showLengthModal state changed to:', showLengthModal);
  }, [showLengthModal]);

  const handleSimplifiedSummary = async () => {
    console.log('🔄 Simplified summary clicked');
    console.log('📄 Document ID:', documentId);
    console.log('🔧 Callback function:', !!onSimplifiedSummary);
    
    if (!documentId || !onSimplifiedSummary) {
      console.log('❌ Missing documentId or callback function');
      return;
    }
    
    setIsGeneratingSimplified(true);
    setSimplifiedProgress(0);
    
    try {
      // Simulate progress updates during API call
      const progressInterval = setInterval(() => {
        setSimplifiedProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until API completes
          return prev + Math.random() * 8;
        });
      }, 200);
      
      console.log('🌐 Making API call to:', `/api/documents/${documentId}/simplified-summary`);
      console.log('⏳ Processing document content with Gemini AI...');
      const response = await fetch(`/api/documents/${documentId}/simplified-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setSimplifiedProgress(100);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Simplified summary received:', typeof data.summary === 'string' ? data.summary.substring(0, 100) + '...' : 'Non-string summary');
        
        // Small delay to show 100% completion
        setTimeout(() => {
          onSimplifiedSummary(data.summary);
          setIsGeneratingSimplified(false);
          setSimplifiedProgress(0);
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        alert(`Error: ${errorData.message || 'Failed to generate simplified summary'}`);
        setIsGeneratingSimplified(false);
        setSimplifiedProgress(0);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      alert('Network error. Please check your connection.');
      setIsGeneratingSimplified(false);
      setSimplifiedProgress(0);
    }
  };

  const handleShorterSummary = async (length: 'short' | 'medium' | 'long') => {
    console.log('🔄 Shorter summary clicked with length:', length);
    console.log('📄 Document ID:', documentId);
    console.log('🔧 Callback function:', !!onShorterSummary);
    
    if (!documentId || !onShorterSummary) {
      console.log('❌ Missing documentId or callback function');
      return;
    }
    
    setIsGeneratingShorter(true);
    setShorterProgress(0);
    setShowLengthModal(false);
    
    try {
      // Simulate progress updates during API call
      const progressInterval = setInterval(() => {
        setShorterProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until API completes
          return prev + Math.random() * 6;
        });
      }, 200);
      
      console.log('🌐 Making API call to:', `/api/documents/${documentId}/shorter-summary`);
      console.log('⏳ Processing document content with Gemini AI...');
      const response = await fetch(`/api/documents/${documentId}/shorter-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ length })
      });
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setShorterProgress(100);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shorter summary received:', typeof data.summary === 'string' ? data.summary.substring(0, 100) + '...' : 'Non-string summary');
        
        // Small delay to show 100% completion
        setTimeout(() => {
          onShorterSummary(data.summary);
          setIsGeneratingShorter(false);
          setShorterProgress(0);
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        alert(`Error: ${errorData.message || 'Failed to generate shorter summary'}`);
        setIsGeneratingShorter(false);
        setShorterProgress(0);
      }
    } catch (error) {
      console.error('❌ Network Error:', error);
      alert('Network error. Please check your connection.');
      setIsGeneratingShorter(false);
      setShorterProgress(0);
    }
  };

  if (!open) return null;
  
  console.log('🔄 SummaryModal render - summary length:', typeof summary === 'string' ? summary.length : 0);
  console.log('🔄 SummaryModal render - summary preview:', typeof summary === 'string' ? summary.substring(0, 100) + '...' : 'Non-string summary');
  
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">{title}</h3>
              <button 
                onClick={onClose} 
                className="text-white hover:text-gray-200 text-2xl leading-none transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        <div className="max-h-[70vh] overflow-y-auto p-6 bg-gray-50">
          <div className="mb-4 flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-600">Summary Content</h4>
            <div className="text-sm text-gray-500">
              Word Count: {typeof summary === 'string' ? summary.split(/\s+/).filter(word => word.length > 0).length : 0} words
            </div>
          </div>
          <div className="prose prose-lg max-w-none select-text">
            {typeof summary === 'string' ? parseFormattedText(summary) : <p className="text-gray-500 italic">No summary available</p>}
          </div>
        </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-white">
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal layout */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
              {/* Action Buttons Container */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 flex-1 sm:flex-initial">
                <button 
                  onClick={handleSimplifiedSummary}
                  disabled={isGeneratingSimplified || !documentId}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 relative overflow-hidden w-full sm:w-auto"
                >
                  {isGeneratingSimplified ? (
                    <div className="flex flex-col items-center space-y-2 w-full">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </div>
                      <ProgressBar 
                        isActive={true} 
                        progress={simplifiedProgress}
                        variant="success" 
                        className="w-full"
                        showPercentage={true}
                        animated={true}
                      />
                    </div>
                  ) : (
                    <>
                      <span>📝</span>
                      <span>More Simplified Version</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    console.log('🔄 Shorter summary button clicked');
                    console.log('📄 Document ID:', documentId);
                    console.log('🔧 Callback function:', !!onShorterSummary);
                    console.log('🔧 Current showLengthModal state:', showLengthModal);
                    console.log('🔧 Setting showLengthModal to true');
                    setShowLengthModal(true);
                    console.log('🔧 showLengthModal state should now be true');
                  }}
                  disabled={isGeneratingShorter || !documentId}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 relative overflow-hidden w-full sm:w-auto"
                >
                  {isGeneratingShorter ? (
                    <div className="flex flex-col items-center space-y-2 w-full">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </div>
                      <ProgressBar 
                        isActive={true} 
                        progress={shorterProgress}
                        variant="warning" 
                        className="w-full"
                        showPercentage={true}
                        animated={true}
                      />
                    </div>
                  ) : (
                    <>
                      <span>📏</span>
                      <span>More Shorter Version</span>
                    </>
                  )}
                </button>
              </div>
              {/* Close Button */}
              <button 
                onClick={onClose} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <LengthSelectionModal
        open={showLengthModal}
        onClose={() => setShowLengthModal(false)}
        onSelectLength={handleShorterSummary}
      />
    </>
  );
};

export default SummaryModal;


