import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { Badge, Button, Banner, Field } from '../components/ui/index.js';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const initials = user.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  async function save(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.patch('/auth/profile', { displayName: name, bio });
      await refresh();
      setMsg('Saved.');
    } catch (e2) {
      setErr(e2.message);
    }
  }
  async function changePw(e) {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await api.post('/auth/change-password', pw);
      setPw({ current: '', next: '' });
      setMsg('Password changed.');
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="page">
      <h1>Profile</h1>
      <div className="row profile-head">
        <div className="avatar">{initials}</div>
        <div>
          <div className="big-name">{user.displayName}</div>
          <div className="mono muted">@{user.username}</div>
          <Badge variant={user.role}>{user.role.toUpperCase()}</Badge>
        </div>
      </div>
      <form className="form narrow" onSubmit={save}>
        <Field
          label="Display name"
          id="profile-name"
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label="Short bio (160 characters)"
          id="profile-bio"
          as="textarea"
          value={bio}
          maxLength={160}
          onChange={(e) => setBio(e.target.value)}
        />
        <Button type="submit" variant="dark">
          Save changes
        </Button>
      </form>
      <form className="form narrow" onSubmit={changePw}>
        <h3>Change password</h3>
        <Field
          label="Current password"
          id="current-pw"
          type="password"
          autoComplete="current-password"
          value={pw.current}
          onChange={(e) => setPw({ ...pw, current: e.target.value })}
        />
        <Field
          label="New password (10+ characters)"
          id="next-pw"
          type="password"
          autoComplete="new-password"
          value={pw.next}
          onChange={(e) => setPw({ ...pw, next: e.target.value })}
        />
        <Button type="submit" variant="dark">
          Change password
        </Button>
      </form>
      {msg && <Banner variant="success">{msg}</Banner>}
      {err && <Banner variant="error">{err}</Banner>}
      <section className="narrow note-block">
        <h3>What others can see</h3>
        <p>
          Your name, username, role and bio, only to people in your community. Your password is
          never shown. There is no phone number or email field on S.T.I.P.S.
        </p>
      </section>
    </div>
  );
}
