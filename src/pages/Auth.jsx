import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';

export default function Auth() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState('signin'); // signin -> password (first time) -> join (if no community)
  const [f, setF] = useState({ username: '', password: '', next: '', code: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function run(fn) {
    setErr(''); setBusy(true);
    try { await fn(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }
  const finish = async (user) => {
    if (user.mustChangePassword) return setStep('password');
    if (!user.communityId) return setStep('join');
    await refresh(); nav('/app/feed');
  };

  const signin = () => run(async () => finish((await api.post('/auth/login', { username: f.username, password: f.password })).user));
  const changePw = () => run(async () => {
    await api.post('/auth/change-password', { current: f.password, next: f.next });
    const { user } = await api.get('/auth/me');
    await finish({ ...user, mustChangePassword: false });
  });
  const join = () => run(async () => { await api.post('/auth/join', { code: f.code }); await refresh(); nav('/app/feed'); });

  return (
    <div className="auth">
      <div className="auth-l">
        <Link to="/" className="wordmark">S.T.I.P.S</Link>
        <div>
          <div className="mono small green-light">ACCOUNTS ARE ISSUED, NOT OPENED</div>
          <h2>Your office gave you a username. That is all you need.</h2>
        </div>
        <p className="muted-light">No public signups. If you have not received a username and first-time password, ask your office or class teacher.</p>
      </div>
      <div className="auth-r">
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); ({ signin, password: changePw, join }[step])(); }}>
          {step === 'signin' && <>
            <h1>Welcome back</h1>
            <label>Username<input autoComplete="username" value={f.username} onChange={set('username')} /></label>
            <label>Password<input type="password" autoComplete="current-password" value={f.password} onChange={set('password')} /></label>
          </>}
          {step === 'password' && <>
            <h1>Set your own password</h1>
            <p className="muted">First sign-in: choose a new password, at least 10 characters.</p>
            <label>New password<input type="password" autoComplete="new-password" value={f.next} onChange={set('next')} /></label>
          </>}
          {step === 'join' && <>
            <h1>Join your community</h1>
            <p className="muted">Enter the code your office shared.</p>
            <label>Community code<input className="code" placeholder="XXXX-XXXX" value={f.code} onChange={set('code')} /></label>
          </>}
          {err && <div className="error" role="alert">{err}</div>}
          <button className="btn btn-dark btn-lg" disabled={busy}>{busy ? 'Please wait…' : step === 'signin' ? 'Sign in' : step === 'password' ? 'Save password' : 'Join'}</button>
          <p className="small muted">Too many wrong attempts pause sign-in for a few minutes. Forgot your password? Ask your office to reset it. <Link to="/cookies">Cookie notice</Link></p>
        </form>
      </div>
    </div>
  );
}
