import { useState, useEffect } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';
import { api } from '../api.js';

export default function Shell() {
  const { user, community, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const closeMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchUnread = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      api
        .get('/messages/unread')
        .then((res) => {
          if (mounted && typeof res.total === 'number') {
            setUnreadTotal(res.total);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 8000);

    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchUnread();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }

    return () => {
      mounted = false;
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, []);

  return (
    <div className="shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
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
          <NavLink
            to="/app/messages"
            onClick={closeMenu}
            className="row between"
            style={{ width: '100%', alignItems: 'center' }}
          >
            <span>Messages</span>
            {unreadTotal > 0 && (
              <span
                className="unread-badge"
                aria-live="polite"
                aria-label={`${unreadTotal} unread messages`}
              >
                {unreadTotal}
              </span>
            )}
          </NavLink>
          <NavLink to="/app/profile" onClick={closeMenu}>
            Profile
          </NavLink>
          {user.role === 'admin' && (
            <NavLink to="/app/admin" onClick={closeMenu}>
              Admin dashboard
            </NavLink>
          )}
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
      <main className="main" id="main-content" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  );
}
