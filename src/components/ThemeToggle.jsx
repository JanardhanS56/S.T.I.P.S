import { useState, useEffect } from 'react';

/**
 * Theme Toggle Component (Item 1: Dark Mode Toggle)
 * Manages dark / light mode via data-theme attribute on <html>.
 */
export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const saved = localStorage.getItem('stips_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('stips_theme', theme);
      } catch {}
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      <span className="mono small">{isDark ? 'Light' : 'Dark'}</span>
    </button>
  );
}
