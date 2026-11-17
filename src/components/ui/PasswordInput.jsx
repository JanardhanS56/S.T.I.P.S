import { useState } from 'react';

/**
 * Password Input with Visibility Toggle (Item 13: Password visibility toggle)
 * Allows users to toggle password masking with accessible controls.
 */
export default function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••••',
  required = false,
  autoComplete = 'current-password',
  className = '',
  disabled = false,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`password-field-wrap ${className}`}>
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
        tabIndex={0}
      >
        <span aria-hidden="true">{showPassword ? '🙈' : '👁'}</span>
      </button>
    </div>
  );
}
