export function Toast({
  message = '',
  variant = 'notice', // 'notice' | 'success' | 'error'
  onClose = null,
  className = '',
  ...props
}) {
  if (!message) return null;

  const bg = variant === 'error' ? '#fbeeed' : variant === 'success' ? 'var(--mint)' : '#fff';
  const border =
    variant === 'error' ? 'var(--alert)' : variant === 'success' ? 'var(--fern)' : 'var(--ink)';
  const color = variant === 'error' ? 'var(--alert)' : 'var(--ink)';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`row between ${className}`.trim()}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 100,
        minWidth: '280px',
        maxWidth: '420px',
        backgroundColor: bg,
        border: `1.5px solid ${border}`,
        borderRadius: '2px',
        padding: '12px 18px',
        color,
        fontSize: '14px',
        fontWeight: 500,
        ...props.style
      }}
      {...props}
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="link-btn small"
          style={{ marginLeft: '12px', color: 'inherit' }}
        >
          Close
        </button>
      )}
    </div>
  );
}

export default Toast;
