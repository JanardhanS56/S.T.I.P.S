import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [err, setErr] = useState('');
  const load = useCallback(async () => setPolls((await api.get('/polls')).polls), []);
  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, [load]);

  async function vote(pollId, optionId) {
    setErr('');
    try {
      await api.post(`/polls/${pollId}/vote`, { optionId });
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }
  const open = polls.filter((p) => !p.closed);
  const closed = polls.filter((p) => p.closed);

  const Poll = ({ p }) => {
    const showBars = p.total !== null;
    return (
      <article className={`card ${p.closed ? '' : 'card-strong'}`}>
        <div className="row meta">
          <b>{p.author.username}</b>
          <span className={`role ${p.author.role}`}>{p.author.role.toUpperCase()}</span>
          <span className="muted small">
            {p.closed ? 'Closed' : `Closes ${new Date(p.closes_at).toLocaleDateString()}`} · One
            vote per person
          </span>
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
              >
                <span className="bar" style={{ width: `${pct}%` }} />
                <span className="opt-l">{o.label}</span>
                {showBars && <span className="mono small">{pct}%</span>}
              </button>
            );
          })}
        </div>
        <p className="small muted">
          {showBars
            ? `${p.total} vote${p.total === 1 ? '' : 's'}`
            : 'Pick one to vote and see results.'}
        </p>
      </article>
    );
  };

  return (
    <div className="page">
      <div className="row between">
        <h1>Polls &amp; votes</h1>
        <Link to="/app/create" className="btn btn-dark">
          Start a poll
        </Link>
      </div>
      {err && (
        <div className="error" role="alert">
          {err}
        </div>
      )}
      <div className="mono small green label">OPEN NOW</div>
      <div className="stack">
        {open.map((p) => (
          <Poll key={p.id} p={p} />
        ))}
        {!open.length && <p className="muted">No open polls.</p>}
      </div>
      {!!closed.length && (
        <>
          <div className="mono small muted label">CLOSED</div>
          <div className="stack">
            {closed.map((p) => (
              <Poll key={p.id} p={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
