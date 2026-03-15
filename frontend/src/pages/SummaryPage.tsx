import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import '../styles/summaryPage.css';

interface SummaryPageProps {}

const SummaryPage: React.FC<SummaryPageProps> = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [currentSummary, setCurrentSummary] = useState<string>('');
  const [originalSummary, setOriginalSummary] = useState<string>('');
  const [summaryType, setSummaryType] = useState<'original' | 'simplified' | 'shorter'>('original');
  const [isGeneratingSimplified, setIsGeneratingSimplified] = useState(false);
  const [isGeneratingShorter, setIsGeneratingShorter] = useState(false);
  const [simplifiedProgress, setSimplifiedProgress] = useState(0);
  const [shorterProgress, setShorterProgress] = useState(0);
  const [showLengthModal, setShowLengthModal] = useState(false);

  useEffect(() => {
    if (documentId) {
      fetchSummary();
    }
  }, [documentId]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentsAPI.summarize(documentId!, { force: false });
      setDocumentTitle(response.data.title || 'Document Summary');
      setCurrentSummary(response.data.summary);
      setOriginalSummary(response.data.summary);
      setSummaryType('original');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handleSimplifiedSummary = async () => {
    if (!documentId) return;
    
    if (summaryType === 'original') {
      setOriginalSummary(currentSummary);
    }
    
    setIsGeneratingSimplified(true);
    setSimplifiedProgress(0);
    
    const progressInterval = setInterval(() => {
      setSimplifiedProgress(prev => {
        const current = prev;
        if (current >= 92) return prev;
        
        let increment;
        if (current < 20) {
          increment = 2 + Math.random() * 3;
        } else if (current < 50) {
          increment = 1 + Math.random() * 2;
        } else if (current < 75) {
          increment = 0.5 + Math.random() * 1.5;
        } else {
          increment = 0.2 + Math.random() * 0.8;
        }
        
        return Math.min(current + increment, 92);
      });
    }, 150);
    
    try {
      const response = await fetch(`/api/documents/${documentId}/simplified-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      clearInterval(progressInterval);
      setSimplifiedProgress(100);
      
      if (response.ok) {
        const data = await response.json();
        setTimeout(() => {
          setCurrentSummary(data.summary);
          setSummaryType('simplified');
          setIsGeneratingSimplified(false);
          setSimplifiedProgress(0);
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to generate simplified summary'}`);
        setIsGeneratingSimplified(false);
        setSimplifiedProgress(0);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      alert('Network error. Please check your connection.');
      setIsGeneratingSimplified(false);
      setSimplifiedProgress(0);
    }
  };

  const handleShorterSummary = async (length: 'short' | 'medium' | 'long') => {
    if (!documentId) return;
    
    if (summaryType === 'original') {
      setOriginalSummary(currentSummary);
    }
    
    setIsGeneratingShorter(true);
    setShorterProgress(0);
    setShowLengthModal(false);
    
    const progressInterval = setInterval(() => {
      setShorterProgress(prev => {
        const current = prev;
        if (current >= 92) return prev;
        
        let increment;
        if (current < 20) {
          increment = 2 + Math.random() * 3;
        } else if (current < 50) {
          increment = 1 + Math.random() * 2;
        } else if (current < 75) {
          increment = 0.5 + Math.random() * 1.5;
        } else {
          increment = 0.2 + Math.random() * 0.8;
        }
        
        return Math.min(current + increment, 92);
      });
    }, 150);
    
    try {
      const response = await fetch(`/api/documents/${documentId}/shorter-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ length })
      });
      
      clearInterval(progressInterval);
      setShorterProgress(100);
      
      if (response.ok) {
        const data = await response.json();
        setTimeout(() => {
          setCurrentSummary(data.summary);
          setSummaryType('shorter');
          setIsGeneratingShorter(false);
          setShorterProgress(0);
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || 'Failed to generate shorter summary'}`);
        setIsGeneratingShorter(false);
        setShorterProgress(0);
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      alert('Network error. Please check your connection.');
      setIsGeneratingShorter(false);
      setShorterProgress(0);
    }
  };

  const parseFormattedText = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, lineIndex) => {
      if (line.trim() === '') {
        elements.push(<br key={`br-${lineIndex}`} />);
        return;
      }

      if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${lineIndex}`}>
            {line.replace('#### ', '')}
          </h4>
        );
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${lineIndex}`}>
            {line.replace('### ', '')}
          </h3>
        );
        return;
      }

      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`quote-${lineIndex}`}>
            {line.replace('> ', '')}
          </blockquote>
        );
        return;
      }

      if (line.startsWith('- ')) {
        elements.push(
          <div key={`bullet-${lineIndex}`} className="bullet-item">
            <span className="bullet-dot">•</span>
            <span>{parseInlineFormatting(line.replace('- ', ''))}</span>
          </div>
        );
        return;
      }

      if (/^\d+\.\s/.test(line)) {
        elements.push(
          <div key={`numbered-${lineIndex}`} className="bullet-item">
            <span className="bullet-dot">{line.match(/^\d+/)?.[0]}.</span>
            <span>{parseInlineFormatting(line.replace(/^\d+\.\s/, ''))}</span>
          </div>
        );
        return;
      }

      elements.push(
        <p key={`p-${lineIndex}`}>
          {parseInlineFormatting(line)}
        </p>
      );
    });

    return elements;
  };

  const parseInlineFormatting = (text: string): (string | JSX.Element)[] => {
    const elements: (string | JSX.Element)[] = [];
    let key = 0;

    const codeSplit = text.split(/`([^`]+)`/);
    
    codeSplit.forEach((part, index) => {
      if (index % 2 === 1) {
        elements.push(
          <code key={`code-${key++}`}>
            {part}
          </code>
        );
      } else {
        const boldSplit = part.split(/\*\*([^*]+)\*\*/);
        boldSplit.forEach((boldPart, boldIndex) => {
          if (boldIndex % 2 === 1) {
            elements.push(
              <strong key={`bold-${key++}`}>
                {boldPart}
              </strong>
            );
          } else {
            const italicSplit = boldPart.split(/\*([^*]+)\*/);
            italicSplit.forEach((italicPart, italicIndex) => {
              if (italicIndex % 2 === 1) {
                elements.push(
                  <em key={`italic-${key++}`}>
                    {italicPart}
                  </em>
                );
              } else {
                elements.push(italicPart);
              }
            });
          }
        });
      }
    });

    return elements;
  };

  if (loading) {
    return (
      <div className="summary-page">
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          <p>Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-page">
        <div className="summary-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-back">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-page">
      {/* Header */}
      <header className="summary-header">
        <div className="summary-header-content">
          <button onClick={() => navigate('/dashboard')} className="btn-back-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back
          </button>
          <h1 className="summary-title">{documentTitle}</h1>
          <div className="summary-header-actions">
            <span className="summary-type-badge">
              {summaryType === 'simplified' ? 'Simplified' : summaryType === 'shorter' ? 'Shorter' : 'Original'}
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="summary-content">
        <div className="summary-container">
          <div className="summary-meta">
            <span className="summary-word-count">
              {currentSummary.split(/\s+/).filter(word => word.length > 0).length} words
            </span>
          </div>
          <div className="summary-prose">
            {parseFormattedText(currentSummary)}
          </div>
        </div>
      </main>

      {/* Footer Actions */}
      <footer className="summary-footer">
        <div className="summary-footer-content">
          {summaryType !== 'original' && (
            <button 
              onClick={() => {
                setCurrentSummary(originalSummary);
                setSummaryType('original');
              }}
              className="summary-action-btn summary-btn-back"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              Back to Original
            </button>
          )}
          
          <div className="summary-action-buttons">
            <button 
              onClick={handleSimplifiedSummary}
              disabled={isGeneratingSimplified}
              className="summary-action-btn summary-btn-simplified"
            >
              {isGeneratingSimplified ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Generating... {Math.round(simplifiedProgress)}%</span>
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
            
            <button 
              onClick={() => setShowLengthModal(true)}
              disabled={isGeneratingShorter}
              className="summary-action-btn summary-btn-shorter"
            >
              {isGeneratingShorter ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Generating... {Math.round(shorterProgress)}%</span>
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
          </div>
        </div>
      </footer>

      {/* Length Selection Modal */}
      {showLengthModal && (
        <div className="length-modal-overlay" onClick={() => setShowLengthModal(false)}>
          <div className="length-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="length-modal-header">
              <h3 className="length-modal-title">Choose Summary Length</h3>
              <button onClick={() => setShowLengthModal(false)} className="length-modal-close">×</button>
            </div>
            <div className="length-modal-body">
              <p className="length-modal-description">How short would you like the summary to be?</p>
              <div className="length-options">
                <button onClick={() => handleShorterSummary('short')} className="length-option">
                  <div className="length-option-title">Short</div>
                  <div className="length-option-desc">About 25% of original length</div>
                </button>
                <button onClick={() => handleShorterSummary('medium')} className="length-option">
                  <div className="length-option-title">Medium</div>
                  <div className="length-option-desc">About 50% of original length</div>
                </button>
                <button onClick={() => handleShorterSummary('long')} className="length-option">
                  <div className="length-option-title">Long</div>
                  <div className="length-option-desc">About 75% of original length</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;
