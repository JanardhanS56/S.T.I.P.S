import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Badge,
  Button,
  Card,
  Chip,
  Banner,
  Field,
  EmptyState,
  Skeleton,
  Modal
} from '../components/ui/index.js';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('members');
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');

  // Search & Filter for members
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Confirmation Modal state for Status Change
  const [statusConfirmModal, setStatusConfirmModal] = useState({
    isOpen: false,
    user: null,
    targetStatus: ''
  });

  // Modal state for Password Reset
  const [resetConfirmUser, setResetConfirmUser] = useState(null);
  const [oneTimePasswordData, setOneTimePasswordData] = useState(null);

  // Bulk member creation state
  const [lines, setLines] = useState('');
  const [createdMembers, setCreatedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  const loadCommunity = useCallback(async () => {
    try {
      const res = await api.get('/admin/community');
      setCommunity(res.community);
    } catch {}
  }, []);

  const loadMembers = useCallback(async () => {
    try {
      const res = await api.get('/admin/members');
      setMembers(res.members || []);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const res = await api.get('/admin/reports');
      setReports(res.reports || []);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  const loadAudit = useCallback(async () => {
    try {
      const res = await api.get('/admin/audit');
      setAuditLogs(res.audit || []);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr('');
    Promise.all([loadCommunity(), loadMembers(), loadReports(), loadAudit()]).finally(() => {
      setLoading(false);
    });
  }, [loadCommunity, loadMembers, loadReports, loadAudit]);

  // Handle member status change
  async function confirmStatusChange() {
    const { user: targetUser, targetStatus } = statusConfirmModal;
    if (!targetUser || !targetStatus) return;
    setStatusConfirmModal({ isOpen: false, user: null, targetStatus: '' });
    setErr('');
    try {
      await api.post(`/admin/users/${targetUser.id}/status`, { status: targetStatus });
      setSuccess(`Updated status for @${targetUser.username} to ${targetStatus}.`);
      await loadMembers();
      await loadAudit();
    } catch (e) {
      setErr(e.message);
    }
  }

  // Handle password reset
  async function executeResetPassword() {
    const targetUser = resetConfirmUser;
    if (!targetUser) return;
    setResetConfirmUser(null);
    setErr('');
    try {
      const res = await api.post(`/admin/users/${targetUser.id}/reset-password`, {});
      setOneTimePasswordData({
        username: targetUser.username,
        password: res.password
      });
      await loadAudit();
    } catch (e) {
      setErr(e.message);
    }
  }

  // Handle report resolution
  async function resolveReport(reportId, action) {
    setErr('');
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { action });
      setSuccess(action === 'hide' ? 'Content hidden and report resolved.' : 'Report dismissed.');
      await loadReports();
      await loadAudit();
    } catch (e) {
      setErr(e.message);
    }
  }

  // Handle bulk member creation
  async function handleAddMembers(e) {
    e.preventDefault();
    setErr('');
    setCreating(true);
    const parsed = lines
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, role = 'student', department = ''] = l.split(',').map((s) => s.trim());
        return {
          name,
          role: role.toLowerCase().startsWith('t') ? 'teacher' : 'student',
          department
        };
      });

    if (parsed.length === 0) {
      setErr('Please enter at least one member.');
      setCreating(false);
      return;
    }

    try {
      const res = await api.post('/admin/members', { members: parsed });
      setCreatedMembers(res.created || []);
      setLines('');
      setSuccess(`Successfully created ${res.created.length} new member credentials.`);
      await loadMembers();
      await loadAudit();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setCreating(false);
    }
  }

  const copyCsv = () => {
    const text = [
      'name,role,username,password',
      ...createdMembers.map((c) => [c.name, c.role, c.username, c.password].join(','))
    ].join('\n');
    navigator.clipboard.writeText(text);
    setSuccess('Copied member credentials to clipboard.');
  };

  const filteredMembers = members.filter((m) => {
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = m.display_name?.toLowerCase().includes(q);
      const matchUser = m.username?.toLowerCase().includes(q);
      return matchName || matchUser;
    }
    return true;
  });

  return (
    <div className="page">
      <div
        className="row between"
        style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}
      >
        <div>
          <h1>Admin dashboard</h1>
          <p className="muted" style={{ margin: 0 }}>
            Manage community members, reports, and review administrative audit logs.
          </p>
        </div>
        {community && (
          <div className="codebox" style={{ padding: '8px 16px' }}>
            <span className="mono small green">JOIN CODE</span>
            <div className="code-big" style={{ fontSize: '20px' }}>
              {community.code}
            </div>
          </div>
        )}
      </div>

      {err && <Banner variant="error">{err}</Banner>}
      {success && <Banner variant="info">{success}</Banner>}

      <div className="chips">
        {[
          ['members', `Members (${members.length})`],
          ['reports', `Reports Queue (${reports.length})`],
          ['audit', `Audit Log (${auditLogs.length})`],
          ['create', '+ Add Members']
        ].map(([k, l]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>
            {l}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="stack">
          <Skeleton height="48px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
      ) : (
        <>
          {/* TAB 1: MEMBERS */}
          {tab === 'members' && (
            <div className="stack">
              <div
                className="row between"
                style={{ alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
              >
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label htmlFor="member-search" className="sr">
                    Search members
                  </label>
                  <input
                    id="member-search"
                    placeholder="Search by name or @username…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                  <label htmlFor="role-filter" className="small muted">
                    Role:
                  </label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
              </div>

              {filteredMembers.length === 0 ? (
                <EmptyState
                  title="No members match search"
                  description="Try adjusting your filter or search keywords."
                />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', minWidth: '640px' }}>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Department</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m) => {
                        const isSelf = m.username === user.username;
                        const isAdmin = m.role === 'admin';
                        return (
                          <tr key={m.id}>
                            <td>
                              <div>
                                <b>{m.display_name}</b>
                              </div>
                              <div className="mono small muted">@{m.username}</div>
                            </td>
                            <td>
                              <Badge variant={m.role}>{m.role.toUpperCase()}</Badge>
                            </td>
                            <td>
                              <Badge
                                variant={
                                  m.status === 'active'
                                    ? 'green'
                                    : m.status === 'muted'
                                      ? 'amber'
                                      : 'red'
                                }
                              >
                                {m.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="small muted">{m.department || '—'}</td>
                            <td style={{ textAlign: 'right' }}>
                              {!isAdmin && !isSelf && (
                                <div
                                  className="row"
                                  style={{ justifyContent: 'flex-end', gap: '6px' }}
                                >
                                  {m.status === 'active' ? (
                                    <>
                                      <Button
                                        variant="outline"
                                        className="small"
                                        onClick={() =>
                                          setStatusConfirmModal({
                                            isOpen: true,
                                            user: m,
                                            targetStatus: 'muted'
                                          })
                                        }
                                      >
                                        Mute
                                      </Button>
                                      <Button
                                        variant="outline"
                                        className="small"
                                        onClick={() =>
                                          setStatusConfirmModal({
                                            isOpen: true,
                                            user: m,
                                            targetStatus: 'suspended'
                                          })
                                        }
                                      >
                                        Suspend
                                      </Button>
                                    </>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      className="small"
                                      onClick={() =>
                                        setStatusConfirmModal({
                                          isOpen: true,
                                          user: m,
                                          targetStatus: 'active'
                                        })
                                      }
                                    >
                                      Activate
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    className="small"
                                    onClick={() => setResetConfirmUser(m)}
                                  >
                                    Reset password
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REPORTS QUEUE */}
          {tab === 'reports' && (
            <div className="stack">
              {reports.length === 0 ? (
                <EmptyState
                  title="No open reports"
                  description="All reported items in your community have been addressed. Good work!"
                />
              ) : (
                reports.map((r) => (
                  <Card key={r.id}>
                    <div className="row meta between" style={{ alignItems: 'center' }}>
                      <div className="row" style={{ alignItems: 'center', gap: '8px' }}>
                        <Badge variant="amber">OPEN REPORT</Badge>
                        <span className="mono small">Target: {r.target_type.toUpperCase()}</span>
                      </div>
                      <span className="muted small">{new Date(r.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: '12px 0 6px 0' }}>
                      <b>Reason:</b> {r.reason}
                    </p>
                    <p className="muted small" style={{ margin: 0 }}>
                      Reported by @{r.reporter?.username || 'unknown'}
                    </p>
                    <div className="row" style={{ marginTop: '16px', gap: '8px' }}>
                      <Button
                        variant="dark"
                        className="small"
                        onClick={() => resolveReport(r.id, 'hide')}
                      >
                        Hide content
                      </Button>
                      <Button
                        variant="outline"
                        className="small"
                        onClick={() => resolveReport(r.id, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOG */}
          {tab === 'audit' && (
            <div className="stack">
              {auditLogs.length === 0 ? (
                <EmptyState
                  title="No audit entries"
                  description="Administrative actions will be automatically recorded here."
                />
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', minWidth: '640px' }}>
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Admin Actor</th>
                        <th>Action</th>
                        <th>Target</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((a) => (
                        <tr key={a.id}>
                          <td className="mono small muted" style={{ whiteSpace: 'nowrap' }}>
                            {new Date(a.created_at).toLocaleString()}
                          </td>
                          <td>
                            <b>@{a.actor?.username || 'admin'}</b>
                          </td>
                          <td>
                            <span className="mono small">{a.action}</span>
                          </td>
                          <td className="small">
                            {a.target_type}
                            {a.target_id && (
                              <span className="mono muted small" style={{ display: 'block' }}>
                                {a.target_id.slice(0, 8)}…
                              </span>
                            )}
                          </td>
                          <td className="mono small muted">{JSON.stringify(a.meta || {})}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADD MEMBERS */}
          {tab === 'create' && (
            <div className="stack narrow">
              <form className="form" onSubmit={handleAddMembers}>
                <h3>Create member accounts</h3>
                <p className="muted small" style={{ margin: 0 }}>
                  Enter one person per line: <code>Name, role, department</code> (e.g.{' '}
                  <code>Ravi K, teacher, Science</code> or <code>Meera P, student</code>).
                </p>
                <Field
                  label="Members list"
                  id="members-bulk"
                  as="textarea"
                  rows={6}
                  className="mono"
                  value={lines}
                  onChange={(e) => setLines(e.target.value)}
                  placeholder="Ravi K, teacher, Science&#10;Meera P, student"
                />
                <Button type="submit" variant="dark" disabled={!lines.trim() || creating}>
                  {creating ? 'Creating…' : 'Generate accounts'}
                </Button>
              </form>

              {createdMembers.length > 0 && (
                <Card>
                  <h4>Generated credentials</h4>
                  <p className="small muted">
                    <b>Hand these over securely now.</b> Passwords are shown only once and cannot be
                    recovered.
                  </p>
                  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table className="table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Username</th>
                          <th>One-time password</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdMembers.map((c) => (
                          <tr key={c.username}>
                            <td>{c.name}</td>
                            <td>{c.role}</td>
                            <td className="mono">{c.username}</td>
                            <td className="mono" style={{ fontWeight: 700 }}>
                              {c.password}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Button variant="outline" onClick={copyCsv}>
                    Copy credentials as CSV
                  </Button>
                </Card>
              )}
            </div>
          )}
        </>
      )}

      {/* CONFIRMATION MODAL: STATUS CHANGE */}
      <Modal
        isOpen={statusConfirmModal.isOpen}
        onClose={() => setStatusConfirmModal({ isOpen: false, user: null, targetStatus: '' })}
        title="Confirm status change"
      >
        <p>
          Are you sure you want to set the status of <b>@{statusConfirmModal.user?.username}</b> to{' '}
          <code>{statusConfirmModal.targetStatus}</code>?
        </p>
        {statusConfirmModal.targetStatus === 'muted' && (
          <p className="small muted">
            Muted users can read content, but are blocked from creating posts, replying, reacting,
            voting, and sending messages.
          </p>
        )}
        {statusConfirmModal.targetStatus === 'suspended' && (
          <p className="small muted">
            Suspended users are blocked from all community participation.
          </p>
        )}
        <div className="row" style={{ marginTop: '20px', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            variant="outline"
            onClick={() => setStatusConfirmModal({ isOpen: false, user: null, targetStatus: '' })}
          >
            Cancel
          </Button>
          <Button variant="dark" onClick={confirmStatusChange}>
            Confirm change
          </Button>
        </div>
      </Modal>

      {/* CONFIRMATION MODAL: RESET PASSWORD */}
      <Modal
        isOpen={Boolean(resetConfirmUser)}
        onClose={() => setResetConfirmUser(null)}
        title="Reset user password"
      >
        <p>
          Reset password for <b>@{resetConfirmUser?.username}</b>?
        </p>
        <p className="small muted">
          This will revoke their active sessions immediately and generate a new temporary password
          that they must change upon next sign in.
        </p>
        <div className="row" style={{ marginTop: '20px', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="outline" onClick={() => setResetConfirmUser(null)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={executeResetPassword}>
            Reset password
          </Button>
        </div>
      </Modal>

      {/* MODAL: ONE-TIME PASSWORD DISPLAY */}
      <Modal
        isOpen={Boolean(oneTimePasswordData)}
        onClose={() => setOneTimePasswordData(null)}
        title="Temporary password generated"
      >
        <p>
          The password for <b>@{oneTimePasswordData?.username}</b> has been reset:
        </p>
        <div className="codebox" style={{ margin: '16px 0', textAlign: 'center' }}>
          <span className="mono small green">ONE-TIME TEMPORARY PASSWORD</span>
          <div className="code-big" style={{ letterSpacing: '2px' }}>
            {oneTimePasswordData?.password}
          </div>
        </div>
        <p className="small muted">
          <b>Copy this password now.</b> It will not be shown again.
        </p>
        <div className="row" style={{ marginTop: '20px', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            variant="outline"
            onClick={() => {
              if (oneTimePasswordData?.password) {
                navigator.clipboard.writeText(oneTimePasswordData.password);
              }
            }}
          >
            Copy password
          </Button>
          <Button variant="dark" onClick={() => setOneTimePasswordData(null)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
}
