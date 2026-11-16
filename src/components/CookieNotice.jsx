import { useState } from 'react';
import { Link } from 'react-router-dom';

// S.T.I.P.S sets ONE cookie: the sign-in session. It is strictly necessary, so no consent
// banner is legally required in most places, but we tell people plainly anyway.
// If you ever add analytics or ads, replace this with a real consent choice.
export default function CookieNotice() {
  const [seen, setSeen] = useState(() => { try { return localStorage.getItem('stips_notice') === '1'; } catch { return false; } });
  if (seen) return null;
  const close = () => { try { localStorage.setItem('stips_notice', '1'); } catch {} setSeen(true); };
  return (
    <div className="cookie" role="region" aria-label="Cookie notice">
      <span>We use one cookie to keep you signed in. No tracking, no ads. <Link to="/cookies">Details</Link></span>
      <button className="btn btn-dark" onClick={close}>Got it</button>
    </div>
  );
}
