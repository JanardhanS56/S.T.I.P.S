import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api } from './api.js';
import Shell from './components/Shell.jsx';
import CookieNotice from './components/CookieNotice.jsx';
import ConsentModal from './components/ConsentModal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Feed from './pages/Feed.jsx';
import Thread from './pages/Thread.jsx';
import Polls from './pages/Polls.jsx';
import Messages from './pages/Messages.jsx';
import Profile from './pages/Profile.jsx';
import Create from './pages/Create.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';
import { Privacy, Terms, Cookies, Guidelines, Accessibility, Contact } from './pages/Legal.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

function RouteFocusAndTitle() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'The Closed Campus Network',
      '/signin': 'Sign In',
      '/privacy': 'Privacy Policy',
      '/terms': 'Terms of Use',
      '/guidelines': 'Community Guidelines',
      '/cookies': 'Cookie Notice',
      '/accessibility': 'Accessibility Statement',
      '/contact': 'Contact & Grievance',
      '/app/feed': 'Community Feed',
      '/app/polls': 'Polls & Votes',
      '/app/messages': 'Messages',
      '/app/profile': 'Profile',
      '/app/create': 'Create',
      '/app/admin': 'Admin Dashboard'
    };

    const path = location.pathname;
    const pageTitle =
      titles[path] || (path.startsWith('/app/feed/') ? 'Post Thread' : 'Page Not Found');
    document.title = pageTitle ? `${pageTitle} · S.T.I.P.S` : 'S.T.I.P.S';

    const timer = setTimeout(() => {
      const h1 = document.querySelector('h1');
      if (h1) {
        h1.setAttribute('tabindex', '-1');
        h1.focus();
      } else {
        const main = document.getElementById('main-content');
        if (main) main.focus();
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [state, setState] = useState({ loading: true, user: null, community: null });

  const refresh = useCallback(async () => {
    try {
      const { user, community } = await api.get('/auth/me');
      setState({ loading: false, user, community });
    } catch {
      setState({ loading: false, user: null, community: null });
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = async () => {
    await api.post('/auth/logout');
    setState({ loading: false, user: null, community: null });
  };

  if (state.loading) return <div className="center-note">Loading…</div>;
  const ready = state.user && state.community;

  return (
    <ErrorBoundary>
      <AuthCtx.Provider value={{ ...state, refresh, logout }}>
        <RouteFocusAndTitle />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<Auth />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/guidelines" element={<Guidelines />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/accessibility" element={<Accessibility />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/app" element={ready ? <Shell /> : <Navigate to="/signin" replace />}>
            <Route index element={<Navigate to="feed" replace />} />
            <Route path="feed" element={<Feed />} />
            <Route path="feed/:id" element={<Thread />} />
            <Route path="polls" element={<Polls />} />
            <Route path="messages" element={<Messages />} />
            <Route path="profile" element={<Profile />} />
            <Route path="create" element={<Create />} />
            <Route
              path="admin"
              element={
                ready && state.user.role === 'admin' ? (
                  <Admin />
                ) : (
                  <Navigate to="/app/feed" replace />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
        {ready && (!state.user.termsVersion || state.user.termsVersion < 1) && (
          <ConsentModal onAccepted={refresh} />
        )}
        <CookieNotice />
      </AuthCtx.Provider>
    </ErrorBoundary>
  );
}
