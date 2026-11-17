import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Banner, Field, PasswordInput } from '../components/ui/index.js';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function Auth() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState('signin'); // signin -> password (first time) -> join (if no community)
  const [f, setF] = useState({ username: '', password: '', next: '', code: '' });
  const [err, setErr] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function run(fn) {
    setErr('');
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  const finish = async (user) => {
    if (user.mustChangePassword) return setStep('password');
    if (!user.communityId) return setStep('join');
    await refresh();
    nav('/app/feed');
  };

  const signin = () =>
    run(async () =>
      finish((await api.post('/auth/login', { username: f.username, password: f.password })).user)
    );
  const changePw = () =>
    run(async () => {
      await api.post('/auth/change-password', { current: f.password, next: f.next });
      setSuccessMsg('Password updated successfully.');
      const { user } = await api.get('/auth/me');
      await finish({ ...user, mustChangePassword: false });
    });
  const join = () =>
    run(async () => {
      await api.post('/auth/join', { code: f.code });
      await refresh();
      nav('/app/feed');
    });

  return (
    <div className="auth">
      <a href="#auth-form-card" className="skip-link">
        Skip to sign in form
      </a>
      <div className="auth-l">
        <Link to="/" className="wordmark">
          S.T.I.P.S
        </Link>
        <div>
          <div className="mono small green-light">ACCOUNTS ARE ISSUED, NOT OPENED</div>
          <h2>Your office gave you a username. That is all you need.</h2>
        </div>
        <p className="muted-light">
          No public signups. If you have not received a username and first-time password, ask your
          office or class teacher.
        </p>
      </div>
      <div className="auth-r" id="auth-form-card">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <ThemeToggle />
        </div>
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            ({ signin, password: changePw, join })[step]();
          }}
        >
          {step === 'signin' && (
            <>
              <h1>Welcome back</h1>
              <Field
                label="Username"
                id="auth-username"
                autoComplete="username"
                value={f.username}
                onChange={set('username')}
              />
              <Field label="Password" id="auth-password">
                <PasswordInput
                  id="auth-password"
                  name="password"
                  autoComplete="current-password"
                  value={f.password}
                  onChange={set('password')}
                />
              </Field>
            </>
          )}
          {step === 'password' && (
            <>
              <h1>Set your own password</h1>
              <p className="muted">First sign-in: choose a new password, at least 10 characters.</p>
              <Field label="New password" id="auth-next">
                <PasswordInput
                  id="auth-next"
                  name="next"
                  autoComplete="new-password"
                  value={f.next}
                  onChange={set('next')}
                />
              </Field>
            </>
          )}
          {step === 'join' && (
            <>
              <h1>Join your community</h1>
              <p className="muted">Enter the code your office shared.</p>
              <Field
                label="Community code"
                id="auth-code"
                placeholder="XXXX-XXXX"
                value={f.code}
                onChange={set('code')}
              />
            </>
          )}
          {successMsg && <div className="form-success-banner">{successMsg}</div>}
          {err && <Banner variant="error">{err}</Banner>}
          <Button type="submit" variant="dark" size="lg" loading={busy}>
            {step === 'signin' ? 'Sign in' : step === 'password' ? 'Save password' : 'Join'}
          </Button>
          <p className="small muted">
            Too many wrong attempts pause sign-in for a few minutes. Forgot your password? Ask your
            office to reset it.
          </p>
          <div
            className="row small muted"
            style={{ marginTop: '16px', gap: '12px', flexWrap: 'wrap' }}
          >
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/cookies">Cookies</Link>
            <Link to="/guidelines">Guidelines</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
