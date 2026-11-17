/**
 * Loading Spinner Component (Item 6: Loading animation)
 * Accessible, lightweight CSS loading spinner.
 */
export default function LoadingSpinner({ label = 'Loading...', size = 20, className = '' }) {
  return (
    <span
      className={`spinner-wrap ${className}`}
      role="status"
      aria-live="polite"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <span
        className="spinner"
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
      />
      {label && (
        <span className="small mono" style={{ color: 'var(--mute)' }}>
          {label}
        </span>
      )}
      <span
        className="sr-only"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }}
      >
        {label}
      </span>
    </span>
  );
}
