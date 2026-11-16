export function Skeleton({ width = '100%', height = '20px', lines = 1, className = '', ...props }) {
  if (lines > 1) {
    return (
      <div
        className={`stack tight ${className}`.trim()}
        role="status"
        aria-label="Loading..."
        {...props}
      >
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i === lines - 1 ? '70%' : width,
              height,
              backgroundColor: 'var(--wash)',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading..."
      className={className}
      style={{
        width,
        height,
        backgroundColor: 'var(--wash)',
        borderRadius: '2px'
      }}
      {...props}
    />
  );
}

export default Skeleton;
