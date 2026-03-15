import React, { useEffect, useState } from 'react';

interface PasswordStrengthProps {
  password: string;
}

function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [label, setLabel] = useState('Type a password');

  useEffect(() => {
    if (!password) {
      setStrength(0);
      setLabel('Type a password');
      return;
    }

    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;

    setStrength(s);

    const labels = ['Too short', 'Needs improvement', 'Good password', 'Strong 🔒'];
    setLabel(s > 0 ? labels[s - 1] : 'Type a password');
  }, [password]);

  const colors = ['#e53e3e', '#d97706', '#2ebfa0', '#17a98e'];

  return (
    <div className={`pws ${password ? 'show' : ''}`} id="pws">
      <div className="pws-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pws-bar"
            id={`pb${i}`}
            style={{
              background: i <= strength ? colors[strength - 1] : 'rgba(46,191,160,.1)',
              transform: i <= strength ? 'scaleY(1.4)' : 'scaleY(1)'
            }}
          ></div>
        ))}
      </div>
      <div
        className="pws-lbl"
        id="pwl"
        style={{ color: strength > 0 ? colors[strength - 1] : 'var(--ink-3)' }}
      >
        {label}
      </div>
    </div>
  );
}

export default PasswordStrength;
