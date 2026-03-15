import React, { useState } from 'react';
import InputField from './InputField';

interface LoginViewProps {
  onLogin: (email: string, password: string) => void;
  onGuest: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
  notify: (type: 'err' | 'warn' | 'ok' | 'info', title: string, msg: string, ms?: number) => void;
}

function LoginView({ onLogin, onGuest, onSwitchToSignup, onForgotPassword, notify }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const newErrors: { email?: boolean; password?: boolean } = {};
    let isValid = true;

    if (!email) {
      notify('err', 'Email required', 'Please enter your email address.');
      newErrors.email = true;
      isValid = false;
    } else if (!validateEmail(email)) {
      notify('err', 'Invalid email', "That email doesn't look right.");
      newErrors.email = true;
      isValid = false;
    }

    if (!password) {
      notify('err', 'Password required', 'Please enter your password.');
      newErrors.password = true;
      isValid = false;
    } else if (password.length < 6) {
      notify('err', 'Password too short', 'Minimum 6 characters required.');
      newErrors.password = true;
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setLoading(true);
    onLogin(email, password);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="view active in" onKeyDown={handleKeyDown}>
      <div className="eyebrow">Welcome back</div>
      <h1 className="f-title">Sign <em>in</em></h1>
      <p className="f-sub">Pick up where you left off.</p>

      <InputField
        id="le"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        onErrorClear={() => setErrors({ ...errors, email: false })}
        validate={validateEmail}
        icon={
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="3" width="13" height="9" rx="1.5"/>
            <path d="M1 4.5L7.5 9 14 4.5"/>
          </svg>
        }
      />

      <div className="field">
        <div className="flbl">
          <label htmlFor="lp">Password</label>
          <button className="hint" onClick={onForgotPassword} type="button">Forgot?</button>
        </div>
        <div className="iwrap">
          <span className="iico">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="7" width="9" height="6.5" rx="1.5"/>
              <path d="M5 7V5a2.5 2.5 0 015 0v2"/>
            </svg>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="lp"
            placeholder="Your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'err' : ''}
            onInput={() => setErrors({ ...errors, password: false })}
          />
          <button className="eye" onClick={togglePassword} type="button" tabIndex={-1} aria-label="Toggle">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <ellipse cx="7" cy="7" rx="6" ry="3.2"/>
              <circle cx="7" cy="7" r="1.8"/>
            </svg>
          </button>
        </div>
      </div>

      <button className={`btn-primary ${loading ? 'ld' : ''}`} onClick={handleSubmit} disabled={loading}>
        <span className="lbl">Sign in</span>
        <svg className="arr" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 6.5h11M7.5 3l4 3.5-4 3.5"/>
        </svg>
        <div className="sp"></div>
      </button>

      <div className="divider">or</div>

      <button className="btn-guest" onClick={onGuest}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="8" cy="5.5" r="2.8"/>
          <path d="M1.5 14.5c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5"/>
        </svg>
        Continue as Guest
      </button>

      <div className="switch-row">
        New here? <button className="blink" onClick={onSwitchToSignup}>Create an account</button>
      </div>
    </div>
  );
}

export default LoginView;
