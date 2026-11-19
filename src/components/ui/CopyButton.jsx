import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * Copy to Clipboard Button
 * Copies supplied text and displays accessible temporary feedback.
 */
export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied',
  className = ''
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Failed to copy
    }
  };

  return (
    <button
      type="button"
      className={`btn-ghost ${copied ? 'copied' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 10px',
        fontSize: '13px',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
      onClick={handleCopy}
      aria-label={`${label} to clipboard`}
      title={label}
    >
      {copied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={1.8} />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
