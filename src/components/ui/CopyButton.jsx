import { useState } from 'react';

/**
 * Copy to Clipboard Button (Item 9: Copy button)
 * Copies supplied text and displays accessible temporary feedback.
 */
export default function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied! ✓',
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
      className={`copy-btn mono ${copied ? 'copied' : ''} ${className}`}
      onClick={handleCopy}
      aria-label={`${label} to clipboard`}
      title={label}
    >
      <span aria-hidden="true">{copied ? '✓' : '⧉'}</span>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
