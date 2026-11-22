import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Badge,
  Button,
  Card,
  Chip,
  Banner,
  EmptyState,
  Skeleton,
  RateLimitNotice
} from '../components/ui/index.js';
import { POLL_TEMPLATES } from '../data/pollTemplates.js';

function formatRemaining(closesAt, isClosed) {
  if (isClosed) return 'Closed';
  const diffMs = new Date(closesAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Closed';
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 1) return `Closes in ${diffDays} days`;
  if (diffDays === 1) return 'Closes in 1 day';
  if (diffHours > 1) return `Closes in ${diffHours} hours`;
  if (diffHours === 1) return 'Closes in 1 hour';
  const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
  return `Closes in ${diffMins} min`;
}

export default function Polls() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [activeView, setActiveView] = useState('polls'); // 'polls' | 'templates'
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [rateLimitErr, setRateLimitErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get('/polls');
      setPolls(res.polls);
    } catch (e) {
      if (e.status === 429) {
        setRateLimitErr(e);
      } else {
        setErr(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function vote(pollId, optionId) {
    setErr('');
    setRateLimitErr(null);
    try {
      await api.post(`/polls/${pollId}/vote`, { optionId });
      await load();
    } catch (e) {
      if (e.status === 429) {
        setRateLimitErr(e);
      } else {
        setErr(e.message);
      }
    }
  }

  async function closePoll(pollId) {
    const confirmed = window.confirm(
      'Are you sure you want to close this poll early? No more votes will be accepted.'
    );
    if (!confirmed) return;
    setErr('');
    setRateLimitErr(null);
    try {
      await api.post(`/polls/${pollId}/close`, {});
      await load();
    } catch (e) {
      if (e.status === 429) {
        setRateLimitErr(e);
      } else {
        setErr(e.message);
      }
    }
  }

  const open = polls.filter((p) => !p.closed);
  const closed = polls.filter((p) => p.closed);

  const Poll = ({ p }) => {
    const showBars = p.total !== null;
    const canClose = !p.closed && (user?.role === 'admin' || user?.username === p.author?.username);

    return (
      <Card as="article" variant={p.closed ? 'default' : 'strong'}>
        <div className="row meta between" style={{ alignItems: 'center' }}>
          <div className="row" style={{ alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <b>{p.author.username}</b>
            <Badge variant={p.author.role}>{p.author.role.toUpperCase()}</Badge>
            <span className="muted small">
              {formatRemaining(p.closes_at, p.closed)} · One vote per person
            </span>
          </div>
          {canClose && (
            <Button variant="outline" className="small" onClick={() => closePoll(p.id)}>
              Close poll
            </Button>
          )}
        </div>
        <h3 className="q">{p.question}</h3>
        <div className="stack tight">
          {p.options.map((o) => {
            const pct = showBars && p.total ? Math.round((o.count / p.total) * 100) : 0;
            const mine = p.myVote === o.id;
            return (
              <button
                key={o.id}
                className={`opt ${mine ? 'mine' : ''}`}
                disabled={p.closed || !!p.myVote}
                onClick={() => vote(p.id, o.id)}
                role={showBars ? 'progressbar' : undefined}
                aria-valuenow={showBars ? pct : undefined}
                aria-valuemin={showBars ? 0 : undefined}
                aria-valuemax={showBars ? 100 : undefined}
                aria-label={
                  showBars
                    ? `${o.label}: ${pct}%, ${o.count} vote${o.count === 1 ? '' : 's'}${mine ? ' (your vote)' : ''}`
                    : o.label
                }
              >
                <span className="bar" style={{ width: `${pct}%` }} />
                <span className="opt-l">
                  {o.label}
                  {mine && (
                    <span
                      className="mono small"
                      style={{
                        marginLeft: '8px',
                        fontWeight: 700,
                        color: 'var(--green)'
                      }}
                    >
                      ✓ Your vote
                    </span>
                  )}
                </span>
                {showBars && (
                  <span className="mono small">
                    {pct}% ({o.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="small muted">
          {showBars
            ? `${p.total} vote${p.total === 1 ? '' : 's'}`
            : 'Pick one to vote and see results.'}
        </p>
      </Card>
    );
  };

  return (
    <div className="page">
      <div className="row between" style={{ alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Polls &amp; votes</h1>
          <p className="muted small" style={{ margin: '4px 0 0' }}>
            Anonymous, one-vote decision making for your campus community.
          </p>
        </div>
        <Link to="/app/create?tab=poll" className="btn btn-dark">
          Start a poll
        </Link>
      </div>

      <div className="chips" style={{ marginBottom: '20px' }}>
        <Chip active={activeView === 'polls'} onClick={() => setActiveView('polls')}>
          Campus polls ({polls.length})
        </Chip>
        <Chip active={activeView === 'templates'} onClick={() => setActiveView('templates')}>
          Templates ({POLL_TEMPLATES.length})
        </Chip>
      </div>

      {err && <Banner variant="error">{err}</Banner>}
      {rateLimitErr && (
        <RateLimitNotice
          seconds={rateLimitErr.retryAfter || 15}
          message={rateLimitErr.message || 'Please wait a moment before trying again.'}
          onReady={() => setRateLimitErr(null)}
        />
      )}

      {activeView === 'templates' ? (
        <div className="stack">
          <p className="muted small" style={{ margin: 0 }}>
            Select any template to immediately open the poll creator pre-filled with questions and
            options.
          </p>
          {POLL_TEMPLATES.map((t) => (
            <Card key={t.id} variant="default">
              <div
                className="row meta between"
                style={{ alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}
              >
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <Badge variant="teacher">{t.category}</Badge>
                  <span className="muted small">Duration: {t.days} days</span>
                </div>
                <Link
                  to={`/app/create?tab=poll&template=${t.id}`}
                  className="btn btn-dark"
                  style={{ minHeight: '34px', padding: '0 14px', fontSize: '13px' }}
                >
                  Use this template →
                </Link>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '17px' }}>{t.title}</h3>
              <p style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--ink)' }}>
                {t.question}
              </p>
              <div className="row" style={{ flexWrap: 'wrap', gap: '6px' }}>
                {t.options.map((opt, idx) => (
                  <span
                    key={idx}
                    className="role"
                    style={{
                      fontSize: '12px',
                      background: 'var(--wash)',
                      border: '1px solid var(--line)',
                      color: 'var(--ink)'
                    }}
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : loading ? (
        <div className="stack" aria-busy="true" aria-label="Loading polls">
          {[1, 2].map((i) => (
            <Card key={i}>
              <div className="row meta" style={{ marginBottom: '12px', gap: '8px' }}>
                <Skeleton width="100px" height="16px" />
                <Skeleton width="60px" height="16px" />
                <Skeleton width="120px" height="16px" />
              </div>
              <Skeleton width="75%" height="24px" style={{ marginBottom: '16px' }} />
              <div className="stack tight">
                <Skeleton height="40px" />
                <Skeleton height="40px" />
              </div>
            </Card>
          ))}
        </div>
      ) : polls.length === 0 ? (
        <EmptyState
          title="No polls active"
          description="No polls have been created yet. You can start one or pick from ready-made templates."
          action={
            <div className="row" style={{ gap: '10px', justifyContent: 'center' }}>
              <Link to="/app/create?tab=poll" className="btn btn-dark">
                Start a poll
              </Link>
              <Button variant="outline" onClick={() => setActiveView('templates')}>
                Browse templates
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="mono small green label">OPEN NOW</div>
          <div className="stack">
            {open.map((p) => (
              <Poll key={p.id} p={p} />
            ))}
            {!open.length && (
              <EmptyState
                title="No open polls right now"
                description="Check back soon or create a new poll for your community."
              />
            )}
          </div>
          {!!closed.length && (
            <>
              <div className="mono small muted label" style={{ marginTop: '24px' }}>
                CLOSED
              </div>
              <div className="stack">
                {closed.map((p) => (
                  <Poll key={p.id} p={p} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
