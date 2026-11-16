import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

export default function Messages() {
  const [threads, setThreads] = useState([]);
  const [people, setPeople] = useState([]);
  const [active, setActive] = useState(null); // {id, username, display_name, role}
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  const loadThreads = useCallback(async () => setThreads((await api.get('/messages/threads')).threads), []);
  useEffect(() => { loadThreads().catch(() => {}); api.get('/messages/people').then((d) => setPeople(d.people)).catch(() => {}); }, [loadThreads]);

  const loadThread = useCallback(async () => { if (active) setMsgs((await api.get(`/messages/with/${active.id}`)).messages); }, [active]);
  useEffect(() => {
    loadThread().catch(() => {});
    const t = setInterval(() => { loadThread().catch(() => {}); loadThreads().catch(() => {}); }, 8000); // simple polling, no websockets needed
    return () => clearInterval(t);
  }, [loadThread, loadThreads]);

  async function send(e) {
    e.preventDefault(); setErr('');
    try { await api.post('/messages', { toUserId: active.id, body: text }); setText(''); await loadThread(); await loadThreads(); } catch (e2) { setErr(e2.message); }
  }

  return (
    <div className="dm">
      <div className="dm-list">
        <h1>Messages</h1>
        <label className="small">Start a chat
          <select value="" onChange={(e) => { const p = people.find((x) => x.id === e.target.value); if (p) setActive(p); }}>
            <option value="">Choose a person…</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.display_name} (@{p.username})</option>)}
          </select>
        </label>
        <div className="stack tight">
          {threads.map((t) => (
            <button key={t.with.id} className={`thread ${active?.id === t.with.id ? 'on' : ''}`} onClick={() => setActive(t.with)}>
              <span className="row between"><b>{t.with.username}</b><span className={`role ${t.with.role}`}>{t.with.role.toUpperCase()}</span></span>
              <span className="muted small">{t.last}</span>
            </button>
          ))}
        </div>
        <p className="small muted note">Only people in your community can message you. Phone numbers and email addresses are blocked automatically.</p>
      </div>
      <div className="dm-thread">
        {active ? <>
          <div className="dm-head"><b>{active.display_name}</b> <span className="muted small">@{active.username}</span></div>
          <div className="dm-msgs">
            {msgs.map((m) => <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>{m.body}</div>)}
          </div>
          <form className="dm-send" onSubmit={send}>
            <label className="sr" htmlFor="msg">Message</label>
            <input id="msg" maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" />
            <button className="btn btn-dark" disabled={!text.trim()}>Send</button>
          </form>
          {err && <div className="error pad" role="alert">{err}</div>}
        </> : <p className="muted pad">Pick someone to start a conversation.</p>}
      </div>
    </div>
  );
}
