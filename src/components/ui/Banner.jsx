export function Banner({
  variant = 'notice', // 'notice' | 'error' | 'success' | 'warn'
  title = '',
  children,
  onDismiss = null,
  className = '',
  ...props
}) {
  const role = variant === 'error' || variant === 'warn' ? 'alert' : 'status';

  const stylesByVariant = {
    notice: {
      backgroundColor: 'var(--wash)',
      borderColor: 'var(--ink)'
    },
    error: {
      backgroundColor: '#fbeeed',
      borderColor: 'var(--alert)',
      color: 'var(--alert)'
    },
    warn: {
      backgroundColor: '#fff7ed',
      borderColor: 'var(--alert)',
      color: 'var(--alert)'
    },
    success: {
      backgroundColor: 'var(--mint)',
      borderColor: 'var(--green)',
      color: 'var(--green)'
    }
  };

  const style = stylesByVariant[variant] || stylesByVariant.notice;

  return (
    <div
      role={role}
      className={`row between ${className}`.trim()}
      style={{
        border: '1.5px solid',
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        padding: '14px 18px',
        borderRadius: '2px',
        alignItems: 'flex-start',
        gap: '16px',
        ...props.style
      }}
      {...props}
    >
      <div className="stack tight" style={{ flex: 1 }}>
        {title && (
          <strong style={{ color: style.color || 'var(--ink)', fontSize: '15px' }}>{title}</strong>
        )}
        {children && (
          <div style={{ color: style.color || 'var(--ink)', fontSize: '14px', lineHeight: 1.5 }}>
            {children}
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss banner"
          className="link-btn small"
          style={{ alignSelf: 'flex-start', color: 'inherit' }}
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export default Banner;
