import { Link } from 'react-router-dom';

/**
 * Floating Contact Button Component (Item 20: Floating contact button)
 * Quick floating access button for inquiries and institutional support.
 */
export default function FloatingContact() {
  return (
    <Link
      to="/contact"
      className="floating-contact-btn mono small"
      aria-label="Contact and support"
      title="Contact support or grievance cell"
    >
      <span aria-hidden="true">✉</span>
      <span>Support</span>
    </Link>
  );
}
