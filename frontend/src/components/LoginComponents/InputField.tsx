import React, { useState } from 'react';

interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  onErrorClear?: () => void;
  validate?: (value: string) => boolean;
  icon: React.ReactNode;
  autoComplete?: string;
}

function InputField({ id, type, label, placeholder, value, onChange, error, onErrorClear, validate, icon, autoComplete }: InputFieldProps) {
  const [showValidTick, setShowValidTick] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    if (onErrorClear) onErrorClear();
    
    if (validate) {
      const isValid = validate(e.target.value);
      setShowValidTick(isValid);
    }
  };

  return (
    <div className="field">
      <div className="flbl">
        <label htmlFor={id}>{label}</label>
      </div>
      <div className="iwrap">
        <span className="iico">{icon}</span>
        <input
          type={type}
          id={id}
          placeholder={placeholder}
          autoComplete={autoComplete}
          value={value}
          onChange={handleInput}
          className={error ? 'err' : ''}
        />
        {validate && (
          <span className={`vtick ${showValidTick ? 'show' : ''}`} id={`vi-${id}`}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M2 6.5l3.5 3.5 5.5-5.5"/>
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}

export default InputField;
