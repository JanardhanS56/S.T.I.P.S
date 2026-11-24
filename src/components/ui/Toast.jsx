import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {}
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const showToast = useCallback((message, variant = 'success', duration = 3500) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, variant });
    if (duration > 0) {
      timerRef.current = setTimeout(() => {
        setToast(null);
      }, duration);
    }
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <Toast message={toast.message} variant={toast.variant} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function Toast({
  message = '',
  variant = 'notice', // 'notice' | 'success' | 'error' | 'info'
  onClose = null,
  className = '',
  ...props
}) {
  if (!message) return null;

  const isSuccess = variant === 'success';
  const isError = variant === 'error';

  const bg = isError ? '#fbeeed' : isSuccess ? '#e8f5e9' : 'var(--wash, #f8f9fa)';
  const border = isError
    ? 'var(--alert, #b3261e)'
    : isSuccess
      ? 'var(--fern, #2e7d32)'
      : 'var(--line, #e5e7eb)';
  const color = isError ? 'var(--alert, #b3261e)' : isSuccess ? '#1b5e20' : 'var(--ink, #111827)';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`toast-container ${className}`.trim()}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        minWidth: '280px',
        maxWidth: '440px',
        backgroundColor: bg,
        border: `1.5px solid ${border}`,
        borderRadius: '6px',
        padding: '12px 16px',
        color,
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        ...props.style
      }}
      {...props}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
        {isSuccess && (
          <CheckCircle2
            size={18}
            strokeWidth={2.2}
            style={{ color: 'var(--fern, #2e7d32)', flexShrink: 0 }}
          />
        )}
        {isError && (
          <AlertCircle
            size={18}
            strokeWidth={2.2}
            style={{ color: 'var(--alert, #b3261e)', flexShrink: 0 }}
          />
        )}
        {!isSuccess && !isError && (
          <Info
            size={18}
            strokeWidth={2.2}
            style={{ color: 'var(--accent, #ff4f2b)', flexShrink: 0 }}
          />
        )}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="link-btn small"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'inherit',
            display: 'inline-flex',
            alignItems: 'center',
            opacity: 0.8
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default Toast;
