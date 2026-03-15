import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import '../styles/summaryModal.css';

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

    // Handle headers (####)
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${lineIndex}`}>
          {line.replace('#### ', '')}
        </h4>
      );
      return;
    }

    // Handle headers (###)
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${lineIndex}`}>
          {line.replace('### ', '')}
        </h3>
      );
      return;
    }

    // Handle blockquotes (>)
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={`quote-${lineIndex}`}>
          {line.replace('> ', '')}
        </blockquote>
      );
      return;
    }

    // Handle bullet points (-)
    if (line.startsWith('- ')) {
      elements.push(
        <div key={`bullet-${lineIndex}`} className="bullet-item">
          <span className="bullet-dot">•</span>
          <span>{parseInlineFormatting(line.replace('- ', ''))}</span>
        </div>
      );
      return;
    }

    // Handle numbered lists (1.)
    if (/^\d+\.\s/.test(line)) {
      elements.push(
        <div key={`numbered-${lineIndex}`} className="bullet-item">
          <span className="bullet-dot">{line.match(/^\d+/)?.[0]}.</span>
          <span>{parseInlineFormatting(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      );
      return;
    }

    // Regular paragraphs
    elements.push(
      <p key={`p-${lineIndex}`}>
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
        <code key={`code-${key++}`}>
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
            <strong key={`bold-${key++}`}>
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
                <em key={`italic-${key++}`}>
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
    <div className="length-modal-overlay">
      <div className="length-modal-container">
        <div className="length-modal-header">
          <div className="length-modal-header-content">
            <h3 className="length-modal-title">Choose Summary Length</h3>
            <button onClick={onClose} className="length-modal-close">×</button>
          </div>
        </div>
        <div className="length-modal-body">
          <p className="length-modal-description">How short would you like the summary to be?</p>
          <div className="length-options">
            <button
              onClick={() => {
                console.log('🔄 Short length selected');
                onSelectLength('short');
              }}
              className="length-option"
            >
              <div className="length-option-title">Short</div>
              <div className="length-option-desc">About 25% of original length</div>
            </button>
            <button
              onClick={() => {
                console.log('🔄 Medium length selected');
                onSelectLength('medium');
              }}
              className="length-option"
            >
              <div className="length-option-title">Medium</div>
              <div className="length-option-desc">About 50% of original length</div>
            </button>
            <button
              onClick={() => {
                console.log('🔄 Long length selected');
                onSelectLength('long');
              }}
              className="length-option"
            >
              <div className="length-option-title">Long</div>
              <div className="length-option-desc">About 75% of original length</div>
            </button>
          </div>
        </div>
        <div className="length-modal-footer">
          <button onClick={onClose} className="length-cancel-btn">Cancel</button>
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
  const [currentSummary, setCurrentSummary] = useState<string | null | undefined>(summary);
  const [originalSummary, setOriginalSummary] = useState<string | null | undefined>(summary);
  const [summaryType, setSummaryType] = useState<'original' | 'simplified' | 'shorter'>('original');
  const simplifiedAbortControllerRef = React.useRef<AbortController | null>(null);
  const shorterAbortControllerRef = React.useRef<AbortController | null>(null);
  const simplifiedProgressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const shorterProgressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync currentSummary with summary prop when it changes
  useEffect(() => {
    setCurrentSummary(summary);
    setOriginalSummary(summary);
    setSummaryType('original');
  }, [summary]);

  const handleCancelSimplified = () => {
    console.log('🛑 Cancel Simplified Summary clicked');
    console.log('🛑 Abort controller:', !!simplifiedAbortControllerRef.current);
    console.log('🛑 Progress interval:', !!simplifiedProgressIntervalRef.current);
    
    if (simplifiedAbortControllerRef.current) {
      console.log('🛑 Aborting simplified summary fetch');
      simplifiedAbortControllerRef.current.abort();
      simplifiedAbortControllerRef.current = null;
    }
    if (simplifiedProgressIntervalRef.current) {
      console.log('🛑 Clearing simplified progress interval');
      clearInterval(simplifiedProgressIntervalRef.current);
      simplifiedProgressIntervalRef.current = null;
    }
    console.log('🛑 Resetting simplified UI state');
    setIsGeneratingSimplified(false);
    setSimplifiedProgress(0);
  };

  const handleCancelShorter = () => {
    console.log('🛑 Cancel Shorter Summary clicked');
    console.log('🛑 Abort controller:', !!shorterAbortControllerRef.current);
    console.log('🛑 Progress interval:', !!shorterProgressIntervalRef.current);
    
    if (shorterAbortControllerRef.current) {
      console.log('🛑 Aborting shorter summary fetch');
      shorterAbortControllerRef.current.abort();
      shorterAbortControllerRef.current = null;
    }
    if (shorterProgressIntervalRef.current) {
      console.log('🛑 Clearing shorter progress interval');
      clearInterval(shorterProgressIntervalRef.current);
      shorterProgressIntervalRef.current = null;
    }
    console.log('🛑 Resetting shorter UI state');
    setIsGeneratingShorter(false);
    setShorterProgress(0);
  };

  // Function to handle print/download as PDF
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print the summary');
      return;
    }

    // Convert summary to HTML with proper formatting
    const formattedHTML = convertMarkdownToHTML(summary || '');

    // Create the print document with styling
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @media print {
              @page { margin: 1in; }
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #2563eb;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              color: #1e40af;
              margin-top: 24px;
              margin-bottom: 12px;
              font-size: 1.5em;
            }
            h3 {
              color: #1e3a8a;
              margin-top: 20px;
              margin-bottom: 10px;
              border-left: 4px solid #3b82f6;
              padding-left: 12px;
              font-size: 1.25em;
            }
            h4 {
              color: #1e40af;
              margin-top: 16px;
              margin-bottom: 8px;
              font-size: 1.1em;
            }
            p {
              margin-bottom: 10px;
              text-align: justify;
            }
            ul, ol {
              margin-left: 20px;
              margin-bottom: 12px;
            }
            li {
              margin-bottom: 6px;
            }
            strong {
              color: #1f2937;
              font-weight: 600;
            }
            em {
              color: #374151;
              font-style: italic;
            }
            code {
              background-color: #f3f4f6;
              color: #dc2626;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }
            blockquote {
              background-color: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 12px;
              margin: 12px 0;
              font-style: italic;
              color: #1e40af;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .print-date {
              color: #6b7280;
              font-size: 0.9em;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>${title}</h1>
            <div class="print-date">Generated on ${new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</div>
          </div>
          ${formattedHTML}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      // Close the window after printing (user can cancel)
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  // Convert markdown to HTML for printing
  const convertMarkdownToHTML = (text: string): string => {
    let html = text;

    // Convert headers
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Convert bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Convert italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Convert code
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // Convert blockquotes
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Convert bullet points
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive <li> tags in <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>(?:\s*<li>[\s\S]*?<\/li>)*)/g, (match) => {
      if (!match.includes('<ul>') && !match.includes('<ol>')) {
        return '<ul>' + match + '</ul>';
      }
      return match;
    });

    // Convert numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive numbered <li> tags in <ol>
    const listItems = html.match(/<li>[\s\S]*?<\/li>/g);
    if (listItems) {
      html = html.replace(/(<li>[\s\S]*?<\/li>(?:\s*<li>[\s\S]*?<\/li>)*)/g, (match) => {
        if (!match.includes('<ul>') && !match.includes('<ol>')) {
          return '<ol>' + match + '</ol>';
        }
        return match;
      });
    }

    // Convert line breaks to paragraphs
    html = html.split('\n\n').map(para => {
      if (!para.trim().startsWith('<') && para.trim() !== '') {
        return '<p>' + para + '</p>';
      }
      return para;
    }).join('\n');

    return html;
  };

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
    
    // Store original summary if not already stored
    if (summaryType === 'original') {
      setOriginalSummary(currentSummary);
    }
    
    setIsGeneratingSimplified(true);
    setSimplifiedProgress(0);
    
    try {
      // Create abort controller for this request
      const abortController = new AbortController();
      simplifiedAbortControllerRef.current = abortController;
      
      // Simulate progress updates during API call
      const progressInterval = setInterval(() => {
        setSimplifiedProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until API completes
          return prev + Math.random() * 8;
        });
      }, 200);
      
      simplifiedProgressIntervalRef.current = progressInterval;
      
      console.log('🌐 Making API call to:', `/api/documents/${documentId}/simplified-summary`);
      console.log('⏳ Processing document content with Gemini AI...');
      const response = await fetch(`/api/documents/${documentId}/simplified-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        signal: abortController.signal
      });
      
      // Complete the progress bar
      clearInterval(progressInterval);
      simplifiedProgressIntervalRef.current = null;
      setSimplifiedProgress(100);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Simplified summary received:', typeof data.summary === 'string' ? data.summary.substring(0, 100) + '...' : 'Non-string summary');
        
        // Small delay to show 100% completion
        setTimeout(() => {
          setCurrentSummary(data.summary);
          setSummaryType('simplified');
          if (onSimplifiedSummary) onSimplifiedSummary(data.summary);
          setIsGeneratingSimplified(false);
          setSimplifiedProgress(0);
          simplifiedAbortControllerRef.current = null;
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        alert(`Error: ${errorData.message || 'Failed to generate simplified summary'}`);
        setIsGeneratingSimplified(false);
        setSimplifiedProgress(0);
        simplifiedAbortControllerRef.current = null;
      }
    } catch (error: any) {
      // Don't show error for aborted requests
      if (error.name !== 'AbortError') {
        console.error('❌ Network Error:', error);
        alert('Network error. Please check your connection.');
      }
      setIsGeneratingSimplified(false);
      setSimplifiedProgress(0);
      simplifiedAbortControllerRef.current = null;
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
      // Create abort controller for this request
      const abortController = new AbortController();
      shorterAbortControllerRef.current = abortController;
      
      // Simulate progress updates during API call
      const progressInterval = setInterval(() => {
        setShorterProgress(prev => {
          if (prev >= 90) return prev; // Stop at 90% until API completes
          return prev + Math.random() * 6;
        });
      }, 200);
      
      shorterProgressIntervalRef.current = progressInterval;
      
      console.log('🌐 Making API call to:', `/api/documents/${documentId}/shorter-summary`);
      console.log('⏳ Processing document content with Gemini AI...');
      const response = await fetch(`/api/documents/${documentId}/shorter-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ length }),
        signal: abortController.signal
      });
      
      // Complete the progress bar
      clearInterval(progressInterval);
      shorterProgressIntervalRef.current = null;
      setShorterProgress(100);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Shorter summary received:', typeof data.summary === 'string' ? data.summary.substring(0, 100) + '...' : 'Non-string summary');
        
        // Small delay to show 100% completion
        setTimeout(() => {
          setCurrentSummary(data.summary);
          setSummaryType('shorter');
          if (onShorterSummary) onShorterSummary(data.summary);
          setIsGeneratingShorter(false);
          setShorterProgress(0);
          shorterAbortControllerRef.current = null;
        }, 500);
      } else {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        alert(`Error: ${errorData.message || 'Failed to generate shorter summary'}`);
        setIsGeneratingShorter(false);
        setShorterProgress(0);
        shorterAbortControllerRef.current = null;
      }
    } catch (error: any) {
      // Don't show error for aborted requests
      if (error.name !== 'AbortError') {
        console.error('❌ Network Error:', error);
        alert('Network error. Please check your connection.');
      }
      setIsGeneratingShorter(false);
      setShorterProgress(0);
      shorterAbortControllerRef.current = null;
    }
  };

  if (!open) return null;
  
  console.log('🔄 SummaryModal render - summary length:', typeof summary === 'string' ? summary.length : 0);
  console.log('🔄 SummaryModal render - summary preview:', typeof summary === 'string' ? summary.substring(0, 100) + '...' : 'Non-string summary');
  
  return (
    <>
      <div className="summary-modal-overlay" onClick={onClose} />
      <div className="summary-modal-container">
        <div className="summary-modal-header">
          <div className="summary-modal-header-content">
            <h1 className="summary-modal-title">{title}</h1>
            <div className="summary-modal-actions">
              <button onClick={handlePrint} className="summary-modal-btn summary-modal-btn-print" title="Print or Download as PDF">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button onClick={onClose} className="summary-modal-btn summary-modal-btn-close">×</button>
            </div>
          </div>
        </div>
        
        <div className="summary-modal-content">
          <div className="summary-modal-meta">
            <span className="summary-meta-label">
              {summaryType === 'simplified' ? 'Simplified Summary' : summaryType === 'shorter' ? 'Shorter Summary' : 'Summary Content'}
            </span>
            <span className="summary-word-count">
              {typeof currentSummary === 'string' ? currentSummary.split(/\s+/).filter(word => word.length > 0).length : 0} words
            </span>
          </div>
          <div className="summary-prose">
            {typeof currentSummary === 'string' ? parseFormattedText(currentSummary) : <p style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>No summary available</p>}
          </div>
        </div>
        
        <div className="summary-modal-footer">
          <div className="summary-footer-content">
            {summaryType !== 'original' && (
              <button 
                onClick={() => {
                  setCurrentSummary(originalSummary);
                  setSummaryType('original');
                }}
                className="summary-back-btn"
                title="Back to original summary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"/>
                  <polyline points="12 19 5 12 12 5"/>
                </svg>
                Back to Original
              </button>
            )}
            <div className="summary-action-buttons">
              <div>
                <button 
                  onClick={handleSimplifiedSummary}
                  disabled={isGeneratingSimplified || !documentId}
                  className="summary-action-btn summary-action-btn-simplified"
                >
                  {isGeneratingSimplified ? (
                    <>
                      <div className="summary-spinner"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      <span>Simplified Version</span>
                    </>
                  )}
                </button>
                {isGeneratingSimplified && (
                  <div className="summary-progress-wrapper">
                    <ProgressBar 
                      isActive={true} 
                      progress={simplifiedProgress}
                      variant="success" 
                      className="w-full"
                      showPercentage={true}
                      animated={true}
                      showCancelButton={true}
                      onCancel={handleCancelSimplified}
                    />
                  </div>
                )}
              </div>
              <div>
                <button 
                  onClick={() => setShowLengthModal(true)}
                  disabled={isGeneratingShorter || !documentId}
                  className="summary-action-btn summary-action-btn-shorter"
                >
                  {isGeneratingShorter ? (
                    <>
                      <div className="summary-spinner"></div>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="21" y1="10" x2="3" y2="10"/>
                        <line x1="21" y1="6" x2="3" y2="6"/>
                        <line x1="21" y1="14" x2="3" y2="14"/>
                        <line x1="16" y1="18" x2="3" y2="18"/>
                      </svg>
                      <span>Shorter Version</span>
                    </>
                  )}
                </button>
                {isGeneratingShorter && (
                  <div className="summary-progress-wrapper">
                    <ProgressBar 
                      isActive={true} 
                      progress={shorterProgress}
                      variant="warning" 
                      className="w-full"
                      showPercentage={true}
                      animated={true}
                      showCancelButton={true}
                      onCancel={handleCancelShorter}
                    />
                  </div>
                )}
              </div>
            </div>
            <button onClick={onClose} className="summary-action-btn summary-action-btn-primary">
              Close
            </button>
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


