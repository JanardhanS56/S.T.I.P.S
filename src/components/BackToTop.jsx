import { useState, useEffect } from 'react';

/**
 * Back To Top Button Component (Item 4: Back to top button)
 * Visible upon scrolling > 300px, smoothly brings user to top.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();

    return () => {
      window.removeEventListener('scroll', checkScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button
      type="button"
      className={`back-to-top-btn ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Scroll back to top"
      title="Back to top"
    >
      <span aria-hidden="true">↑</span>
    </button>
  );
}
