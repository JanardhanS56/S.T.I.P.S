import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function Shell() {
  const { user, community, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="shell">
      <header className="mobile-bar">
        <Link to="/" className="wordmark" onClick={closeMenu}>
          S.T.I.P.S
        </Link>
        <span className="mobile-community mono small green-light">{community.name}</span>
        <button
          type="button"
          className="mobile-menu-btn"
          aria-expanded={mobileMenuOpen}
          aria-controls="shell-sidebar"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>
      <aside id="shell-sidebar" className={`side ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <Link to="/" className="wordmark desktop-only">
          S.T.I.P.S
        </Link>
        <div className="side-community desktop-only">
          <span className="mono small green-light">COMMUNITY</span>
          <strong>{community.name}</strong>
        </div>
        <nav className="side-nav" aria-label="Main Navigation">
          <NavLink to="/app/feed" onClick={closeMenu}>
            Community feed
          </NavLink>
          <NavLink to="/app/polls" onClick={closeMenu}>
            Polls &amp; votes
          </NavLink>
          <NavLink to="/app/messages" onClick={closeMenu}>
            Messages
          </NavLink>
          <NavLink to="/app/profile" onClick={closeMenu}>
            Profile
          </NavLink>
        </nav>
        <Link to="/app/create" className="btn btn-green" onClick={closeMenu}>
          + Create
        </Link>
        <div className="side-foot">
          <strong>{user.username}</strong>
          <span>{user.role}</span>
          <span>
            <button className="link-btn" onClick={logout}>
              Sign out
            </button>{' '}
            ·{' '}
            <Link to="/privacy" onClick={closeMenu}>
              Policy
            </Link>{' '}
            ·{' '}
            <Link to="/cookies" onClick={closeMenu}>
              Cookies
            </Link>
          </span>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
