import React, { useState } from 'react';
import InputField from './InputField';

interface AdminLoginViewProps {
  onLogin: (email: string, password: string) => void;
  notify: (type: 'err' | 'warn' | 'ok' | 'info', title: string, msg: string, ms?: number) => void;
}

function AdminLoginView({ onLogin, notify }: AdminLoginViewProps) {
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
      notify('err', 'Email required', 'Please enter your admin email address.');
      newErrors.email = true;
      isValid = false;
    } else if (!validateEmail(email)) {
      notify('err', 'Invalid email', "That email doesn't look right.");
      newErrors.email = true;
      isValid = false;
    }

    if (!password) {
      notify('err', 'Password required', 'Please enter your admin password.');
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
      <div className="eyebrow" style={{ color: '#dc2626' }}>Admin Access</div>
      <h1 className="f-title">Admin <em>Panel</em></h1>
      <p className="f-sub">Secure administrator login.</p>

      <InputField
        id="admin-email"
        type="email"
        label="Admin Email"
        placeholder="admin@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        onErrorClear={() => setErrors({ ...errors, email: false })}
        validate={validateEmail}
        icon={
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M7.5 1L10 4.5H5L7.5 1Z"/>
            <circle cx="7.5" cy="8.5" r="2.5"/>
            <path d="M3 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4"/>
          </svg>
        }
      />

      <div className="field">
        <div className="flbl">
          <label htmlFor="admin-password">Admin Password</label>
        </div>
        <div className="iwrap">
          <span className="iico">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="7" width="9" height="6.5" rx="1.5"/>
              <path d="M5 7V5a2.5 2.5 0 015 0v2"/>
              <circle cx="7.5" cy="10" r="0.8" fill="currentColor"/>
            </svg>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="admin-password"
            placeholder="Your admin password"
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

      <button 
        className={`btn-primary ${loading ? 'ld' : ''}`} 
        onClick={handleSubmit} 
        disabled={loading}
        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
      >
        <span className="lbl">Admin Sign in</span>
        <svg className="arr" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 6.5h11M7.5 3l4 3.5-4 3.5"/>
        </svg>
        <div className="sp"></div>
      </button>

      <div className="switch-row" style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#6b7280' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.4rem' }}>
          <circle cx="7" cy="7" r="5.5"/>
          <path d="M7 4v3.5M7 10v0.5"/>
        </svg>
        Admin credentials required
      </div>
    </div>
  );
}

export default AdminLoginView;
