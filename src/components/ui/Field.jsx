export function Field({
  label,
  id,
  hint = '',
  error = '',
  required = false,
  as: Component = 'input',
  className = '',
  children,
  ...props
}) {
  const inputId = id || props.name;
  const errorId = inputId ? `${inputId}-error` : undefined;
  const hintId = inputId ? `${inputId}-hint` : undefined;

  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`stack tight ${className}`.trim()}>
      {label && (
        <label htmlFor={inputId}>
          <span>
            {label}
            {required && (
              <span aria-hidden="true" style={{ color: 'var(--alert)', marginLeft: '4px' }}>
                *
              </span>
            )}
          </span>
        </label>
      )}

      {children ? (
        children
      ) : (
        <Component
          id={inputId}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          className={error ? 'input-error' : undefined}
          style={error ? { borderColor: 'var(--alert)' } : undefined}
          {...props}
        />
      )}

      {hint && !error && (
        <span id={hintId} className="small muted">
          {hint}
        </span>
      )}

      {error && (
        <span id={errorId} role="alert" className="small warn" style={{ fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export default Field;
