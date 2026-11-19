export function Badge({
  type = 'role', // 'role' | 'tag' | 'official'
  variant = '', // 'student' | 'teacher' | 'admin' | 'Notice' | 'Event' | 'Meme' | 'Moment' | 'official'
  children,
  className = '',
  ...props
}) {
  if (type === 'tag') {
    const tagVariant = variant || children;
    return (
      <span className={`tag ${tagVariant || ''} ${className}`.trim()} {...props}>
        {children}
      </span>
    );
  }

  if (type === 'official' || variant === 'official') {
    return (
      <span
        className={`role official ${className}`.trim()}
        style={{ letterSpacing: '0.06em', fontWeight: 700 }}
        {...props}
      >
        {children || 'OFFICIAL'}
      </span>
    );
  }

  // Default: role badge
  const roleClass = variant === 'teacher' || variant === 'admin' ? variant : '';
  return (
    <span className={`role ${roleClass} ${className}`.trim()} {...props}>
      {children || variant}
    </span>
  );
}

export default Badge;
