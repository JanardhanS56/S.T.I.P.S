import { useEffect, useRef } from 'react';

export function Modal({
  isOpen = false,
  onClose,
  title = '',
  children,
  className = '',
  maxWidth = '520px'
}) {
  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;

      // Handle Escape key and Tab focus trap
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose?.();
          return;
        }

        if (e.key === 'Tab' && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const firstEl = focusable[0];
          const lastEl = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault();
              lastEl.focus();
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault();
              firstEl.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Focus first element or modal container
      const timer = setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          } else {
            modalRef.current.focus();
          }
        }
      }, 50);

      // Prevent body scroll while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
        if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
          triggerRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(14, 15, 13, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={`card-strong stack ${className}`.trim()}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: '#fff',
          padding: '28px',
          borderRadius: '2px',
          outline: 'none',
          boxShadow: 'none'
        }}
      >
        <div className="row between" style={{ alignItems: 'flex-start', marginBottom: '8px' }}>
          {title && (
            <h2 id="modal-title" style={{ margin: 0, fontSize: '22px' }}>
              {title}
            </h2>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="link-btn"
            style={{ fontSize: '14px', marginLeft: 'auto' }}
          >
            Close
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
