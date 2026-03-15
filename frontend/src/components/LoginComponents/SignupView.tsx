import React, { useState } from 'react';
import InputField from './InputField';
import PasswordStrength from './PasswordStrength';

interface SignupViewProps {
  onSignup: (name: string, email: string, password: string) => void;
  onSwitchToLogin: () => void;
  notify: (type: 'err' | 'warn' | 'ok' | 'info', title: string, msg: string, ms?: number) => void;
}

function SignupView({ onSignup, onSwitchToLogin, notify }: SignupViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  const validateName = (n: string) => n.trim().length >= 2;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const newErrors: { name?: boolean; email?: boolean; password?: boolean; confirmPassword?: boolean } = {};
    let isValid = true;

    if (!name || name.trim().length < 2) {
      notify('err', 'Name required', 'Enter your full name (min. 2 characters).');
      newErrors.name = true;
      isValid = false;
    }

    if (!email) {
      notify('err', 'Email required', 'An email is needed to create your account.');
      newErrors.email = true;
      isValid = false;
    } else if (!validateEmail(email)) {
      notify('err', 'Invalid email', 'Please enter a valid email address.');
      newErrors.email = true;
      isValid = false;
    }

    if (!password) {
      notify('err', 'Password required', 'Create a password for your account.');
      newErrors.password = true;
      isValid = false;
    } else if (password.length < 6) {
      notify('err', 'Password too short', 'Use at least 6 characters.');
      newErrors.password = true;
      isValid = false;
    } else if (password.length < 8) {
      notify('warn', 'Weak password', 'Try adding numbers or symbols for better security.', 5000);
    }

    if (!confirmPassword) {
      notify('err', 'Confirm password', 'Please re-enter your password.');
      newErrors.confirmPassword = true;
      isValid = false;
    } else if (password !== confirmPassword) {
      notify('err', "Passwords don't match", 'The two passwords you entered differ.');
      newErrors.confirmPassword = true;
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setLoading(true);
    onSignup(name, email, password);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="view active in" onKeyDown={handleKeyDown}>
      <div className="eyebrow">Join for free</div>
      <h1 className="f-title">Create <em>account</em></h1>
      <p className="f-sub">Start learning smarter. No credit card needed.</p>

      <InputField
        id="sn"
        type="text"
        label="Full name"
        placeholder="Your full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        onErrorClear={() => setErrors({ ...errors, name: false })}
        validate={validateName}
        autoComplete="name"
        icon={
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="7.5" cy="5" r="2.8"/>
            <path d="M1.5 14c0-3.5 2.8-5.5 6-5.5s6 2 6 5.5"/>
          </svg>
        }
      />

      <InputField
        id="se"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        onErrorClear={() => setErrors({ ...errors, email: false })}
        validate={validateEmail}
        autoComplete="email"
        icon={
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="1" y="3" width="13" height="9" rx="1.5"/>
            <path d="M1 4.5L7.5 9 14 4.5"/>
          </svg>
        }
      />

      <div className="field">
        <div className="flbl"><label htmlFor="sp">Password</label></div>
        <div className="iwrap">
          <span className="iico">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="7" width="9" height="6.5" rx="1.5"/>
              <path d="M5 7V5a2.5 2.5 0 015 0v2"/>
            </svg>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            id="sp"
            placeholder="Create a password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? 'err' : ''}
            onInput={() => setErrors({ ...errors, password: false })}
          />
          <button className="eye" onClick={() => setShowPassword(!showPassword)} type="button" tabIndex={-1}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <ellipse cx="7" cy="7" rx="6" ry="3.2"/>
              <circle cx="7" cy="7" r="1.8"/>
            </svg>
          </button>
        </div>
        <PasswordStrength password={password} />
      </div>

      <div className="field">
        <div className="flbl"><label htmlFor="sp2">Confirm password</label></div>
        <div className="iwrap">
          <span className="iico">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="7" width="9" height="6.5" rx="1.5"/>
              <path d="M5 7V5a2.5 2.5 0 015 0v2"/>
            </svg>
          </span>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id="sp2"
            placeholder="Repeat password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={errors.confirmPassword ? 'err' : ''}
            onInput={() => setErrors({ ...errors, confirmPassword: false })}
          />
          <button className="eye" onClick={() => setShowConfirmPassword(!showConfirmPassword)} type="button" tabIndex={-1}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <ellipse cx="7" cy="7" rx="6" ry="3.2"/>
              <circle cx="7" cy="7" r="1.8"/>
            </svg>
          </button>
        </div>
      </div>

      <button className={`btn-primary ${loading ? 'ld' : ''}`} onClick={handleSubmit} disabled={loading}>
        <span className="lbl">Create account</span>
        <svg className="arr" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M1 6.5h11M7.5 3l4 3.5-4 3.5"/>
        </svg>
        <div className="sp"></div>
      </button>

      <p className="terms">
        By signing up you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>.
      </p>

      <div className="switch-row">
        Already have an account? <button className="blink" onClick={onSwitchToLogin}>Sign in</button>
      </div>
    </div>
  );
}

export default SignupView;
