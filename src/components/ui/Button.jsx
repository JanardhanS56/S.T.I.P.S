import LoadingSpinner from './LoadingSpinner.jsx';

export function Button({
  variant = 'outline', // 'outline' | 'dark' | 'green' | 'link'
  size = 'default', // 'default' | 'lg'
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  onClick,
  ...props
}) {
  if (variant === 'link') {
    return (
      <button
        type={type}
        disabled={disabled || loading}
        className={`link-btn ${className}`.trim()}
        onClick={onClick}
        {...props}
      >
        {loading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LoadingSpinner size={14} label="" />
            <span>Please wait...</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }

  const classes = [
    'btn',
    variant === 'dark' ? 'btn-dark' : '',
    variant === 'green' ? 'btn-green' : '',
    size === 'lg' ? 'btn-lg' : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? 'true' : undefined}
      className={classes}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span
          className="row"
          style={{ gap: '8px', alignItems: 'center', justifyContent: 'center' }}
        >
          <LoadingSpinner size={14} label="" />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
