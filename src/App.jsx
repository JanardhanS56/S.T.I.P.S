import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api.js';
import Shell from './components/Shell.jsx';
import CookieNotice from './components/CookieNotice.jsx';
import Landing from './pages/Landing.jsx';
import Auth from './pages/Auth.jsx';
import Feed from './pages/Feed.jsx';
import Polls from './pages/Polls.jsx';
import Messages from './pages/Messages.jsx';
import Profile from './pages/Profile.jsx';
import Create from './pages/Create.jsx';
import { Privacy, Guidelines, Cookies } from './pages/Legal.jsx';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

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
  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => { await api.post('/auth/logout'); setState({ loading: false, user: null, community: null }); };

  if (state.loading) return <div className="center-note">Loading…</div>;
  const ready = state.user && state.community;

  return (
    <AuthCtx.Provider value={{ ...state, refresh, logout }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route path="/app" element={ready ? <Shell /> : <Navigate to="/signin" replace />}>
          <Route index element={<Navigate to="feed" replace />} />
          <Route path="feed" element={<Feed />} />
          <Route path="polls" element={<Polls />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile" element={<Profile />} />
          <Route path="create" element={<Create />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieNotice />
    </AuthCtx.Provider>
  );
}
