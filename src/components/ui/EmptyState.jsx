export function EmptyState({
  title = 'Nothing here yet',
  description = '',
  action = null,
  className = '',
  ...props
}) {
  return (
    <div
      className={`card center-note stack ${className}`.trim()}
      style={{
        padding: '56px 24px',
        alignItems: 'center',
        textAlign: 'center',
        borderStyle: 'dashed'
      }}
      {...props}
    >
      <h3 style={{ margin: 0, fontSize: '20px', color: 'var(--ink)' }}>{title}</h3>
      {description && (
        <p className="muted" style={{ margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '12px' }}>{action}</div>}
    </div>
  );
}

export default EmptyState;
