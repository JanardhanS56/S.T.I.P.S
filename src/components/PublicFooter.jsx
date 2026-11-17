import { Link } from 'react-router-dom';

export default function PublicFooter() {
  return (
    <footer className="foot" role="contentinfo">
      <span>
        <b className="wordmark dark">S.T.I.P.S</b> · Closed Campus Network
      </span>
      <nav aria-label="Legal and help" className="foot-links">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/cookies">Cookies</Link>
        <Link to="/guidelines">Guidelines</Link>
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/contact">Contact</Link>
      </nav>
    </footer>
  );
}
