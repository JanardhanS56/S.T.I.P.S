import { useEffect, useState, useCallback } from 'react';
import { UserPlus, MoreVertical, Key, VolumeX, ShieldAlert, CheckCircle } from 'lucide-react';
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
  Modal,
  CopyButton,
  useToast
} from '../components/ui/index.js';

export default function Admin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('members');
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
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

  // Modal state for Deletion Request Confirmation
  const [deletionConfirmModal, setDeletionConfirmModal] = useState({
    isOpen: false,
    request: null
  });

  // Dropdown menu state for table rows
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Member creation state
  const [memberForm, setMemberForm] = useState({
    name: '',
    roleSelect: 'student',
    customRole: '',
    department: '',
    rollNumber: '',
    section: ''
  });
  const [addingSingle, setAddingSingle] = useState(false);
  const [addMode, setAddMode] = useState('single'); // 'single' | 'bulk'
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

  const loadDeletionRequests = useCallback(async () => {
    try {
      const res = await api.get('/admin/deletion-requests');
      setDeletionRequests(res.requests || []);
    } catch (e) {
      setErr(e.message);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setErr('');
    Promise.all([
      loadCommunity(),
      loadMembers(),
      loadReports(),
      loadAudit(),
      loadDeletionRequests()
    ]).finally(() => {
      setLoading(false);
    });
  }, [loadCommunity, loadMembers, loadReports, loadAudit, loadDeletionRequests]);

  // Handle member status change
  async function confirmStatusChange() {
    const { user: targetUser, targetStatus } = statusConfirmModal;
    if (!targetUser || !targetStatus) return;
    setStatusConfirmModal({ isOpen: false, user: null, targetStatus: '' });
    setErr('');
    try {
      await api.post(`/admin/users/${targetUser.id}/status`, { status: targetStatus });
      const msg = `Updated status for @${targetUser.username} to ${targetStatus}.`;
      setSuccess(msg);
      showToast(msg, 'success');
      await loadMembers();
      await loadAudit();
    } catch (e) {
      setErr(e.message);
      showToast(e.message || 'Status change failed.', 'error');
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
      showToast(`Temporary password generated for @${targetUser.username}.`, 'success');
      await loadAudit();
    } catch (e) {
      setErr(e.message);
      showToast(e.message || 'Password reset failed.', 'error');
    }
  }

  // Handle report resolution
  async function resolveReport(reportId, action) {
    setErr('');
    try {
      await api.post(`/admin/reports/${reportId}/resolve`, { action });
      const msg = action === 'hide' ? 'Content hidden and report resolved.' : 'Report dismissed.';
      setSuccess(msg);
      showToast(msg, 'success');
      await loadReports();
      await loadAudit();
    } catch (e) {
      setErr(e.message);
      showToast(e.message || 'Action failed.', 'error');
    }
  }

  // Handle deletion request confirmation
  async function confirmDeletion() {
    const { request: targetRequest } = deletionConfirmModal;
    if (!targetRequest) return;
    setDeletionConfirmModal({ isOpen: false, request: null });
    setErr('');
    try {
      await api.post(`/admin/deletion-requests/${targetRequest.id}/confirm`, {});
      const msg = `Account for @${targetRequest.user?.username || 'member'} has been anonymized and credentials disabled.`;
      setSuccess(msg);
      showToast(msg, 'success');
      await loadDeletionRequests();
      await loadMembers();
      await loadAudit();
    } catch (e) {
      setErr(e.message);
      showToast(e.message || 'Confirmation failed.', 'error');
    }
  }

  // Handle deletion request rejection
  async function rejectDeletion(reqId) {
    setErr('');
    try {
      await api.post(`/admin/deletion-requests/${reqId}/reject`, {});
      const msg = 'Deletion request marked as rejected.';
      setSuccess(msg);
      showToast(msg, 'success');
      await loadDeletionRequests();
      await loadAudit();
    } catch (e) {
      setErr(e.message);
      showToast(e.message || 'Rejection failed.', 'error');
    }
  }

  // Handle single member creation with role selector
  async function handleCreateSingleMember(e) {
    e.preventDefault();
    if (!memberForm.name.trim()) return;
    setErr('');
    setAddingSingle(true);

    const finalRole =
      memberForm.roleSelect === 'custom'
        ? memberForm.customRole.trim() || 'student'
        : memberForm.roleSelect;

    try {
      const res = await api.post('/admin/members', {
        members: [
          {
            name: memberForm.name.trim(),
            role: finalRole,
            department: memberForm.department.trim(),
            rollNumber: memberForm.rollNumber.trim(),
            section: memberForm.section.trim()
          }
        ]
      });
      setCreatedMembers(res.created || []);
      setMemberForm({
        name: '',
        roleSelect: 'student',
        customRole: '',
        department: '',
        rollNumber: '',
        section: ''
      });
      const usernameCreated = res.created?.[0]?.username || 'member';
      const msg = `Successfully created account for @${usernameCreated}.`;
      setSuccess(msg);
      showToast(msg, 'success');
      await loadMembers();
      await loadAudit();
    } catch (e2) {
      setErr(e2.message);
      showToast(e2.message || 'Member creation failed.', 'error');
    } finally {
      setAddingSingle(false);
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
        const [name, rawRole = 'student', department = '', rollNumber = '', section = ''] = l
          .split(',')
          .map((s) => s.trim());

        let role = rawRole.toLowerCase();
        if (role.startsWith('stud')) role = 'student';
        else if (role.startsWith('teach')) role = 'teacher';
        else if (role.startsWith('non')) role = 'non_staff';
        else if (role.startsWith('ext')) role = 'external_guide';
        else if (!role) role = 'student';

        return {
          name,
          role,
          department,
          rollNumber,
          section
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
      const msg = `Successfully created ${res.created.length} new member credentials.`;
      setSuccess(msg);
      showToast(msg, 'success');
      await loadMembers();
      await loadAudit();
    } catch (e2) {
      setErr(e2.message);
      showToast(e2.message || 'Creation failed.', 'error');
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
    const msg = 'Copied member credentials to clipboard.';
    setSuccess(msg);
    showToast(msg, 'success');
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
    <div className="page wide">
      <div
        className="row between"
        style={{ alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '8px' }}
      >
        <div>
          <h1 style={{ marginBottom: '4px' }}>Admin dashboard</h1>
          <p className="muted" style={{ margin: 0 }}>
            Manage community members, reports, and review administrative audit logs.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {community ? (
            <div className="codebox" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="mono small" style={{ fontWeight: 600, color: 'var(--mute)' }}>
                JOIN CODE
              </span>
              <span className="code-big">{community.code}</span>
              <CopyButton text={community.code} label="Copy code" />
            </div>
          ) : (
            <Skeleton width="180px" height="42px" />
          )}
          <Button
            type="button"
            variant="dark"
            onClick={() => setTab('create')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <UserPlus size={16} strokeWidth={2} />
            <span>+ Add Members</span>
          </Button>
        </div>
      </div>

      {err && <Banner variant="error">{err}</Banner>}
      {success && <Banner variant="info">{success}</Banner>}

      <div className="chips" style={{ marginTop: '16px', marginBottom: '24px' }}>
        {[
          ['members', `Members (${members.length})`],
          ['reports', `Reports Queue (${reports.length})`],
          [
            'deletions',
            `Deletion Requests (${deletionRequests.filter((r) => r.status === 'pending').length})`
          ],
          ['audit', `Audit Log (${auditLogs.length})`]
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
                <div style={{ width: '180px' }}>
                  <select
                    id="role-filter"
                    aria-label="Filter by role"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    style={{ width: '100%', height: '48px' }}
                  >
                    <option value="all">All roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="non_staff">Non-staff</option>
                    <option value="external_guide">External guide</option>
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
                            <td className="small">
                              <div>{m.department || '—'}</div>
                              {(m.rollNumber || m.section) && (
                                <div
                                  className="mono small muted"
                                  style={{ fontSize: '11px', marginTop: '2px' }}
                                >
                                  {m.rollNumber && <span>Roll: {m.rollNumber} </span>}
                                  {m.section && <span>Sec: {m.section}</span>}
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', position: 'relative' }}>
                              {!isAdmin && !isSelf && (
                                <div style={{ display: 'inline-block', position: 'relative' }}>
                                  <button
                                    type="button"
                                    className="btn-ghost"
                                    aria-label={`Actions for @${m.username}`}
                                    aria-expanded={activeMenuId === m.id}
                                    style={{
                                      padding: '6px 8px',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() =>
                                      setActiveMenuId(activeMenuId === m.id ? null : m.id)
                                    }
                                  >
                                    <MoreVertical size={16} strokeWidth={2} />
                                  </button>
                                  {activeMenuId === m.id && (
                                    <div
                                      className="card"
                                      style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '100%',
                                        zIndex: 20,
                                        minWidth: '160px',
                                        padding: '6px',
                                        marginTop: '4px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '2px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                      }}
                                    >
                                      {m.status === 'active' ? (
                                        <>
                                          <button
                                            type="button"
                                            className="btn-ghost"
                                            style={{
                                              width: '100%',
                                              justifyContent: 'flex-start',
                                              padding: '8px 10px',
                                              fontSize: '13px',
                                              border: 'none',
                                              gap: '8px'
                                            }}
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              setStatusConfirmModal({
                                                isOpen: true,
                                                user: m,
                                                targetStatus: 'muted'
                                              });
                                            }}
                                          >
                                            <VolumeX size={14} /> Mute
                                          </button>
                                          <button
                                            type="button"
                                            className="btn-ghost"
                                            style={{
                                              width: '100%',
                                              justifyContent: 'flex-start',
                                              padding: '8px 10px',
                                              fontSize: '13px',
                                              border: 'none',
                                              gap: '8px',
                                              color: 'var(--red)'
                                            }}
                                            onClick={() => {
                                              setActiveMenuId(null);
                                              setStatusConfirmModal({
                                                isOpen: true,
                                                user: m,
                                                targetStatus: 'suspended'
                                              });
                                            }}
                                          >
                                            <ShieldAlert size={14} /> Suspend
                                          </button>
                                        </>
                                      ) : (
                                        <button
                                          type="button"
                                          className="btn-ghost"
                                          style={{
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            padding: '8px 10px',
                                            fontSize: '13px',
                                            border: 'none',
                                            gap: '8px'
                                          }}
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            setStatusConfirmModal({
                                              isOpen: true,
                                              user: m,
                                              targetStatus: 'active'
                                            });
                                          }}
                                        >
                                          <CheckCircle size={14} /> Activate
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className="btn-ghost"
                                        style={{
                                          width: '100%',
                                          justifyContent: 'flex-start',
                                          padding: '8px 10px',
                                          fontSize: '13px',
                                          border: 'none',
                                          gap: '8px'
                                        }}
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          setResetConfirmUser(m);
                                        }}
                                      >
                                        <Key size={14} /> Reset password
                                      </button>
                                    </div>
                                  )}
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

          {/* TAB 3: DELETION REQUESTS */}
          {tab === 'deletions' && (
            <div className="stack">
              {deletionRequests.length === 0 ? (
                <EmptyState
                  title="No deletion requests"
                  description="When members request account erasure, their requests appear here for review."
                />
              ) : (
                deletionRequests.map((req) => (
                  <Card key={req.id}>
                    <div
                      className="row between"
                      style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}
                    >
                      <div>
                        <b>
                          {req.user?.display_name || 'Member'} (@{req.user?.username || 'user'})
                        </b>{' '}
                        <Badge
                          variant={
                            req.status === 'pending'
                              ? 'amber'
                              : req.status === 'confirmed'
                                ? 'red'
                                : 'neutral'
                          }
                        >
                          {req.status.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="mono small muted">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {req.reason && (
                      <p className="small muted" style={{ margin: '8px 0' }}>
                        Reason: {req.reason}
                      </p>
                    )}

                    {req.status === 'pending' && (
                      <div className="row" style={{ marginTop: '12px', gap: '8px' }}>
                        <Button
                          variant="danger"
                          className="small"
                          onClick={() => setDeletionConfirmModal({ isOpen: true, request: req })}
                        >
                          Confirm &amp; Anonymize
                        </Button>
                        <Button
                          variant="outline"
                          className="small"
                          onClick={() => rejectDeletion(req.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 4: AUDIT LOG */}
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
              <div className="chips" style={{ marginBottom: '16px' }}>
                <Chip active={addMode === 'single'} onClick={() => setAddMode('single')}>
                  Add individual member
                </Chip>
                <Chip active={addMode === 'bulk'} onClick={() => setAddMode('bulk')}>
                  Bulk CSV import
                </Chip>
              </div>

              {addMode === 'single' ? (
                <form className="form" onSubmit={handleCreateSingleMember}>
                  <h3>Create member account</h3>
                  <p className="muted small" style={{ margin: 0 }}>
                    Add a new campus member. Credentials will be generated and printed once below.
                  </p>
                  <Field
                    label="Full Name"
                    id="new-member-name"
                    value={memberForm.name}
                    maxLength={60}
                    placeholder="e.g. Aarav Sharma"
                    required
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  />

                  <div className="stack tight">
                    <label htmlFor="new-member-role">Role</label>
                    <select
                      id="new-member-role"
                      value={memberForm.roleSelect}
                      onChange={(e) => setMemberForm({ ...memberForm, roleSelect: e.target.value })}
                      style={{ height: '48px' }}
                    >
                      <option value="student">Student (default)</option>
                      <option value="teacher">Teacher</option>
                      <option value="non_staff">
                        Non-staff (e.g., support or maintenance workers)
                      </option>
                      <option value="external_guide">External guide</option>
                      <option value="custom">Custom role...</option>
                    </select>
                  </div>

                  {memberForm.roleSelect === 'custom' && (
                    <Field
                      label="Custom role name"
                      id="new-member-custom-role"
                      value={memberForm.customRole}
                      maxLength={40}
                      placeholder="e.g. Lab Assistant, Placement Officer, Mentor"
                      required
                      onChange={(e) => setMemberForm({ ...memberForm, customRole: e.target.value })}
                    />
                  )}

                  <Field
                    label="Department / Program"
                    id="new-member-dept"
                    value={memberForm.department}
                    maxLength={80}
                    placeholder="e.g. Computer Science and Engineering, AI & ML"
                    onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                  />

                  <div className="row" style={{ gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <Field
                        label="Roll Number (optional)"
                        id="new-member-roll"
                        value={memberForm.rollNumber}
                        maxLength={40}
                        placeholder="e.g. 4SH25CI21 or 12"
                        onChange={(e) =>
                          setMemberForm({ ...memberForm, rollNumber: e.target.value })
                        }
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Field
                        label="Section / Classroom (optional)"
                        id="new-member-sec"
                        value={memberForm.section}
                        maxLength={40}
                        placeholder="e.g. A, B, or 402"
                        onChange={(e) => setMemberForm({ ...memberForm, section: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <Button
                      type="submit"
                      variant="dark"
                      loading={addingSingle}
                      disabled={!memberForm.name.trim() || addingSingle}
                    >
                      Add member
                    </Button>
                  </div>
                </form>
              ) : (
                <form className="form" onSubmit={handleAddMembers}>
                  <h3>Bulk create member accounts</h3>
                  <p className="muted small" style={{ margin: 0 }}>
                    Enter one person per line:{' '}
                    <code>Name, role, department, rollNumber, section</code>. Role defaults to{' '}
                    <strong>student</strong> if omitted.
                  </p>
                  <Field
                    label="Members list"
                    id="members-bulk"
                    as="textarea"
                    rows={6}
                    className="mono"
                    value={lines}
                    onChange={(e) => setLines(e.target.value)}
                    placeholder="Ravi K, teacher, Science&#10;Meera P, student, CS, 4SH25CS01, A&#10;Suresh M, non_staff, Maintenance"
                  />
                  <Button
                    type="submit"
                    variant="dark"
                    loading={creating}
                    disabled={!lines.trim() || creating}
                  >
                    Generate accounts
                  </Button>
                </form>
              )}

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
                            <td>
                              <Badge variant={c.role}>{c.role.toUpperCase()}</Badge>
                            </td>
                            <td className="mono">{c.username}</td>
                            <td className="mono" style={{ fontWeight: 700 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{c.password}</span>
                                <CopyButton text={c.password} label="Copy pw" />
                              </div>
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

      {/* CONFIRMATION MODAL: CONFIRM DELETION */}
      <Modal
        isOpen={deletionConfirmModal.isOpen}
        onClose={() => setDeletionConfirmModal({ isOpen: false, request: null })}
        title="Confirm Account Erasure & Anonymization"
      >
        <p>
          Are you sure you want to permanently erase and anonymize the account for{' '}
          <b>@{deletionConfirmModal.request?.user?.username}</b>?
        </p>
        <p className="small muted">
          <strong>This action cannot be undone.</strong> The user&apos;s name and bio will be wiped,
          username randomized to <code>deleted-*</code>, password disabled, active sessions revoked,
          and past posts/replies anonymized to &ldquo;Deleted user&rdquo;.
        </p>
        <div className="row" style={{ marginTop: '20px', justifyContent: 'flex-end', gap: '8px' }}>
          <Button
            variant="outline"
            onClick={() => setDeletionConfirmModal({ isOpen: false, request: null })}
          >
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDeletion}>
            Confirm &amp; Anonymize
          </Button>
        </div>
      </Modal>
    </div>
  );
}
