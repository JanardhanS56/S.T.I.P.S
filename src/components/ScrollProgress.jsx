import { useState, useEffect } from 'react';

/**
 * Scroll Progress Bar Component (Item 8: Scroll progress bar)
 * Smoothly displays reading / scroll progress at top of screen.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        setProgress(0);
        return;
      }
      const current = (window.scrollY / totalHeight) * 100;
      setProgress(Math.min(100, Math.max(0, current)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (progress <= 0) return null;

  return (
    <div
      className="scroll-progress-bar"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-label="Page scroll progress"
    />
  );
}
