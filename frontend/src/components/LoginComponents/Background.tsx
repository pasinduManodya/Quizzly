import React from 'react';

function Background() {
  return (
    <div className="bg">
      <div className="bg-dots"></div>
      <div className="bg-lines"></div>
      <div className="bg-radial-tl"></div>
      <div className="bg-radial-br"></div>

      <div className="bg-grid-accent tl">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="18" height="18" rx="3" fill="rgba(46,191,160,.07)" stroke="rgba(46,191,160,.15)" strokeWidth="1"/>
          <rect x="24" y="0" width="18" height="18" rx="3" fill="rgba(46,191,160,.04)" stroke="rgba(46,191,160,.1)" strokeWidth="1"/>
          <rect x="48" y="0" width="18" height="18" rx="3" fill="rgba(46,191,160,.02)" stroke="rgba(46,191,160,.07)" strokeWidth="1"/>
          <rect x="0" y="24" width="18" height="18" rx="3" fill="rgba(46,191,160,.04)" stroke="rgba(46,191,160,.1)" strokeWidth="1"/>
          <rect x="24" y="24" width="18" height="18" rx="3" fill="rgba(46,191,160,.02)" stroke="rgba(46,191,160,.07)" strokeWidth="1"/>
          <rect x="0" y="48" width="18" height="18" rx="3" fill="rgba(46,191,160,.02)" stroke="rgba(46,191,160,.06)" strokeWidth="1"/>
        </svg>
      </div>
      <div className="bg-grid-accent br">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="18" height="18" rx="3" fill="rgba(46,191,160,.07)" stroke="rgba(46,191,160,.15)" strokeWidth="1"/>
          <rect x="24" y="0" width="18" height="18" rx="3" fill="rgba(46,191,160,.04)" stroke="rgba(46,191,160,.1)" strokeWidth="1"/>
          <rect x="48" y="0" width="18" height="18" rx="3" fill="rgba(46,191,160,.02)" stroke="rgba(46,191,160,.07)" strokeWidth="1"/>
          <rect x="0" y="24" width="18" height="18" rx="3" fill="rgba(46,191,160,.04)" stroke="rgba(46,191,160,.1)" strokeWidth="1"/>
          <rect x="24" y="24" width="18" height="18" rx="3" fill="rgba(46,191,160,.02)" stroke="rgba(46,191,160,.07)" strokeWidth="1"/>
          <rect x="0" y="48" width="18" height="18" rx="3" fill="rgba(46,191,160,.02)" stroke="rgba(46,191,160,.06)" strokeWidth="1"/>
        </svg>
      </div>
    </div>
  );
}

export default Background;
