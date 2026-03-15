import React, { useState } from 'react';

const TOAST_ICONS = {
  err: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#e53e3e" strokeWidth="2" strokeLinecap="round">
      <circle cx="7" cy="7" r="5.5"/>
      <path d="M7 4.5v3M7 9.5h.01"/>
    </svg>
  ),
  warn: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
      <path d="M6.1 2.1l-5 9h9.8l-5-9z"/>
      <path d="M7 6v2.5M7 10h.01"/>
    </svg>
  ),
  ok: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#2ebfa0" strokeWidth="2.2" strokeLinecap="round">
      <path d="M2.5 7l3.5 3.5 5.5-5.5"/>
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
      <circle cx="7" cy="7" r="5.5"/>
      <path d="M7 9.5V7M7 4.5h.01"/>
    </svg>
  )
};

interface ToastProps {
  type: 'err' | 'warn' | 'ok' | 'info';
  title: string;
  msg?: string;
  ms: number;
  onClose: () => void;
}

function Toast({ type, title, msg, ms, onClose }: ToastProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`toast t-${type} ${isClosing ? 'out' : ''}`}>
      <div className="toast-ico">{TOAST_ICONS[type]}</div>
      <div className="toast-body">
        <div className="toast-ttl">{title}</div>
        {msg && <div className="toast-msg">{msg}</div>}
      </div>
      <button className="toast-x" onClick={handleClose} aria-label="Close">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 2l7 7M9 2l-7 7"/>
        </svg>
      </button>
      <div className="toast-bar" style={{ animationDuration: `${ms}ms` }}></div>
    </div>
  );
}

export default Toast;
