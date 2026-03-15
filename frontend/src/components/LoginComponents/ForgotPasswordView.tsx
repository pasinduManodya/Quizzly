import React, { useState } from 'react';
import InputField from './InputField';

interface ForgotPasswordViewProps {
  onForgot: (email: string) => void;
  onBackToLogin: () => void;
  notify: (type: 'err' | 'warn' | 'ok' | 'info', title: string, msg: string, ms?: number) => void;
}

function ForgotPasswordView({ onForgot, onBackToLogin, notify }: ForgotPasswordViewProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email) {
      notify('err', 'Email required', 'Enter the email linked to your account.');
      setError(true);
      return;
    }

    if (!validateEmail(email)) {
      notify('err', 'Invalid email', 'Please enter a valid email address.');
      setError(true);
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onForgot(email);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="view active in" onKeyDown={handleKeyDown}>
      <div className="eyebrow">Recovery</div>
      <h1 className="f-title">Reset <em>password</em></h1>
      <p className="f-sub">We'll send a secure reset link to your inbox.</p>

      <InputField
        id="fe"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        onErrorClear={() => setError(false)}
        validate={validateEmail}
        icon={
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="3" width="13" height="9" rx="1.5"/>
            <path d="M1 4.5L7.5 9 14 4.5"/>
          </svg>
        }
      />

      <button className={`btn-primary ${loading ? 'ld' : ''}`} onClick={handleSubmit} disabled={loading}>
        <span className="lbl">Send reset link</span>
        <svg className="arr" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 6.5h11M7.5 3l4 3.5-4 3.5"/>
        </svg>
        <div className="sp"></div>
      </button>

      <div className="switch-row" style={{ marginTop: '14px' }}>
        <button className="blink" onClick={onBackToLogin}>← Back to sign in</button>
      </div>
    </div>
  );
}

export default ForgotPasswordView;
