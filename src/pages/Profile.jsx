import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { Badge, Button, Banner, Field, Modal, PasswordInput } from '../components/ui/index.js';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio || '');
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState('');
  const [deletionRequest, setDeletionRequest] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
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

  async function handleExport() {
    setErr('');
    setMsg('');
    setExportMsg('');
    setExporting(true);
    try {
      const data = await api.get('/me/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stips-data-export-${user.username}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportMsg('Export complete! Your download should begin automatically.');
    } catch (e2) {
      setErr(e2.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .get('/me/delete-request')
      .then((res) => {
        if (active && res?.request) {
          setDeletionRequest(res.request);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleDeleteRequest(e) {
    e.preventDefault();
    setDeleteSubmitting(true);
    setErr('');
    try {
      const res = await api.post('/me/delete-request', { reason: deleteReason || undefined });
      setDeletionRequest(res.request);
      setDeleteModalOpen(false);
      setDeleteReason('');
      setMsg('Account deletion request submitted. An administrator will review your request.');
    } catch (e2) {
      setErr(e2.message || 'Failed to submit deletion request.');
    } finally {
      setDeleteSubmitting(false);
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
        <Field label="Current password" id="current-pw">
          <PasswordInput
            id="current-pw"
            name="current-pw"
            autoComplete="current-password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
          />
        </Field>
        <Field label="New password (10+ characters)" id="next-pw">
          <PasswordInput
            id="next-pw"
            name="next-pw"
            autoComplete="new-password"
            value={pw.next}
            onChange={(e) => setPw({ ...pw, next: e.target.value })}
          />
        </Field>
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

      <section
        className="narrow"
        style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid var(--line)'
        }}
      >
        <h3>Your Data &amp; Privacy</h3>
        <p className="small muted">
          In compliance with digital data protection principles, you may download a complete,
          machine-readable archive of your personal account data, authored posts, replies, poll
          votes, and direct messages.
        </p>
        <div style={{ marginTop: '16px' }}>
          <Button type="button" variant="outline" loading={exporting} onClick={handleExport}>
            Export my data (JSON)
          </Button>
        </div>
        {exportMsg && (
          <Banner variant="success" style={{ marginTop: '12px' }}>
            {exportMsg}
          </Banner>
        )}

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px dashed var(--line)'
          }}
        >
          <h4 style={{ marginBottom: '8px' }}>Account Deletion</h4>
          <p className="small muted">
            You may request permanent erasure of your account. Upon administrative confirmation,
            your username and display name are anonymized to &ldquo;Deleted user&rdquo; and your
            credentials are permanently deactivated.
          </p>

          {deletionRequest ? (
            <div style={{ marginTop: '12px' }}>
              {deletionRequest.status === 'pending' && (
                <Banner variant="info">
                  Account deletion requested on{' '}
                  {new Date(deletionRequest.created_at).toLocaleDateString()}. Status:{' '}
                  <strong>Pending administrative review</strong>.
                </Banner>
              )}
              {deletionRequest.status === 'rejected' && (
                <div>
                  <Banner variant="warn">
                    Your previous deletion request was rejected
                    {deletionRequest.admin_notes ? `: "${deletionRequest.admin_notes}"` : '.'}
                  </Banner>
                  <div style={{ marginTop: '12px' }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDeleteModalOpen(true)}
                    >
                      Request account deletion again
                    </Button>
                  </div>
                </div>
              )}
              {deletionRequest.status === 'confirmed' && (
                <Banner variant="info">This account has been anonymized.</Banner>
              )}
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <Button type="button" variant="danger" onClick={() => setDeleteModalOpen(true)}>
                Request account deletion
              </Button>
            </div>
          )}
        </div>
      </section>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Request Account Deletion"
      >
        <p className="small muted">
          Requesting account deletion is permanent. Once approved by an administrator, your name and
          username will be anonymized (&ldquo;Deleted user&rdquo;), all active sessions will be
          terminated, and login credentials disabled. Authored posts and replies will remain
          attributed to &ldquo;Deleted user&rdquo; to preserve community conversation context.
        </p>
        <form onSubmit={handleDeleteRequest} style={{ marginTop: '16px' }}>
          <Field
            label="Reason for deletion (optional)"
            id="delete-reason"
            as="textarea"
            value={deleteReason}
            maxLength={300}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="e.g., Graduating / no longer using the campus portal"
          />
          <div
            className="row"
            style={{ marginTop: '16px', justifyContent: 'flex-end', gap: '8px' }}
          >
            <Button type="button" variant="ghost" onClick={() => setDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={deleteSubmitting}>
              Confirm Deletion Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
