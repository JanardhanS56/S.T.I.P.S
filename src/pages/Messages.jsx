import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import {
  Badge,
  Button,
  Banner,
  EmptyState,
  Skeleton,
  RateLimitNotice
} from '../components/ui/index.js';

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [people, setPeople] = useState([]);
  const [active, setActive] = useState(null); // {id, username, display_name, role}
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [rateLimitErr, setRateLimitErr] = useState(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const loadThreads = useCallback(async () => {
    try {
      const res = await api.get('/messages/threads');
      setThreads(res.threads);
    } catch (e) {
      if (e.status === 429) setRateLimitErr(e);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    api
      .get('/messages/people')
      .then((d) => setPeople(d.people))
      .catch(() => {});
  }, [loadThreads]);

  const loadThread = useCallback(async () => {
    if (!active) return;
    setLoadingMsgs(true);
    try {
      const res = await api.get(`/messages/with/${active.id}`);
      setMsgs(res.messages);
    } catch (e) {
      if (e.status === 429) {
        setRateLimitErr(e);
      } else {
        setErr(e.message);
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, [active]);

  useEffect(() => {
    loadThread();
    const t = setInterval(() => {
      loadThread();
      loadThreads();
    }, 8000); // simple polling, no websockets needed
    return () => clearInterval(t);
  }, [loadThread, loadThreads]);

  async function send(e) {
    e.preventDefault();
    setErr('');
    setRateLimitErr(null);
    try {
      await api.post('/messages', { toUserId: active.id, body: text });
      setText('');
      await loadThread();
      await loadThreads();
    } catch (e2) {
      if (e2.status === 429) {
        setRateLimitErr(e2);
      } else {
        setErr(e2.message);
      }
    }
  }

  return (
    <div className="dm">
      <div className="dm-list">
        <h1>Messages</h1>
        <label className="small">
          Start a chat
          <select
            value=""
            onChange={(e) => {
              const p = people.find((x) => x.id === e.target.value);
              if (p) setActive(p);
            }}
          >
            <option value="">Choose a person…</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name} (@{p.username})
              </option>
            ))}
          </select>
        </label>
        <div className="stack tight">
          {loadingThreads ? (
            <div className="stack tight" style={{ padding: '8px 0' }}>
              <Skeleton height="44px" />
              <Skeleton height="44px" />
              <Skeleton height="44px" />
            </div>
          ) : threads.length > 0 ? (
            threads.map((t) => (
              <button
                key={t.with.id}
                className={`thread ${active?.id === t.with.id ? 'on' : ''}`}
                onClick={() => setActive(t.with)}
              >
                <span className="row between">
                  <b>{t.with.username}</b>
                  <Badge variant={t.with.role}>{t.with.role.toUpperCase()}</Badge>
                </span>
                <span className="muted small">{t.last}</span>
              </button>
            ))
          ) : (
            <p className="small muted pad" style={{ margin: 0 }}>
              No message threads yet. Pick a person above to start talking.
            </p>
          )}
        </div>
        <p className="small muted note">
          Only people in your community can message you. Phone numbers and email addresses are
          blocked automatically.
        </p>
      </div>
      <div className="dm-thread">
        {active ? (
          <>
            <div className="dm-head">
              <b>{active.display_name}</b> <span className="muted small">@{active.username}</span>
            </div>
            <div className="dm-msgs">
              {loadingMsgs ? (
                <div className="stack" style={{ padding: '16px' }}>
                  <Skeleton height="36px" width="60%" />
                  <Skeleton height="36px" width="40%" style={{ alignSelf: 'flex-end' }} />
                  <Skeleton height="36px" width="50%" />
                </div>
              ) : msgs.length > 0 ? (
                msgs.map((m) => (
                  <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>
                    {m.body}
                  </div>
                ))
              ) : (
                <EmptyState
                  className="pad"
                  title="No messages yet"
                  description={`This is the start of your direct conversation with @${active.username}. Say hello!`}
                />
              )}
            </div>
            <form className="dm-send" onSubmit={send}>
              <label className="sr" htmlFor="msg">
                Message
              </label>
              <input
                id="msg"
                maxLength={500}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message"
              />
              <Button type="submit" variant="dark" disabled={!text.trim()}>
                Send
              </Button>
            </form>
            {err && (
              <Banner variant="error" className="pad">
                {err}
              </Banner>
            )}
            {rateLimitErr && (
              <div className="pad">
                <RateLimitNotice
                  seconds={rateLimitErr.retryAfter || 10}
                  message={
                    rateLimitErr.message ||
                    'You have sent many messages recently. Take a short break.'
                  }
                  onReady={() => setRateLimitErr(null)}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState
            className="pad"
            title="No conversation selected"
            description="Pick someone to start a conversation."
          />
        )}
      </div>
    </div>
  );
}
