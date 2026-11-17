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
        {loading ? 'Please wait...' : children}
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
        <span className="row" style={{ gap: '8px' }}>
          <span className="mono small">...</span>
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
