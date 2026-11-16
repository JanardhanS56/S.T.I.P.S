import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../App.jsx';

export default function Shell() {
  const { user, community, logout } = useAuth();
  return (
    <div className="shell">
      <aside className="side">
        <Link to="/" className="wordmark">S.T.I.P.S</Link>
        <div className="side-community">
          <span className="mono small green-light">COMMUNITY</span>
          <strong>{community.name}</strong>
        </div>
        <nav className="side-nav">
          <NavLink to="/app/feed">Community feed</NavLink>
          <NavLink to="/app/polls">Polls &amp; votes</NavLink>
          <NavLink to="/app/messages">Messages</NavLink>
          <NavLink to="/app/profile">Profile</NavLink>
        </nav>
        <Link to="/app/create" className="btn btn-green">+ Create</Link>
        <div className="side-foot">
          <strong>{user.username}</strong>
          <span>{user.role}</span>
          <span><button className="link-btn" onClick={logout}>Sign out</button> · <Link to="/privacy">Policy</Link> · <Link to="/cookies">Cookies</Link></span>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}
