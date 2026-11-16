import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';

const CATS = ['Notice', 'Event', 'Meme', 'Moment'];
const MAX = 280;
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 1 ? 'now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('All');
  const [text, setText] = useState('');
  const [cat, setCat] = useState('Notice');
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    const q = filter === 'All' ? '' : `?category=${filter}`;
    setPosts((await api.get(`/posts${q}`)).posts);
  }, [filter]);
  useEffect(() => { load().catch((e) => setErr(e.message)); }, [load]);

  async function publish(e) {
    e.preventDefault(); setErr('');
    try { await api.post('/posts', { body: text, category: cat }); setText(''); await load(); } catch (e2) { setErr(e2.message); }
  }
  async function report(id) {
    const reason = window.prompt('Why are you reporting this post?');
    if (reason) try { await api.post('/reports', { targetType: 'post', targetId: id, reason }); alert('Thanks. The office will review it.'); } catch (e2) { alert(e2.message); }
  }

  const left = MAX - text.length;
  return (
    <div className="page">
      <h1>Community feed</h1>
      <form className="card composer" onSubmit={publish}>
        <label htmlFor="post">Share with campus</label>
        <textarea id="post" maxLength={MAX} value={text} onChange={(e) => setText(e.target.value)} placeholder="A notice, an event, a meme, a funny moment..." />
        <div className="row between">
          <div className="chips">{CATS.map((c) => <button type="button" key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}</div>
          <div className="row"><span className={`mono small ${left < 30 ? 'warn' : ''}`}>{left} left</span><button className="btn btn-dark" disabled={!text.trim()}>Post</button></div>
        </div>
        {err && <div className="error" role="alert">{err}</div>}
      </form>

      <div className="chips filters">{['All', ...CATS].map((c) => <button key={c} className={`chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c}</button>)}</div>
      <div className="stack">
        {posts.map((p) => (
          <article key={p.id} className="card">
            <div className="row meta">
              <b>{p.author.username}</b>
              <span className={`role ${p.author.role}`}>{p.author.role.toUpperCase()}</span>
              <span className="muted small">{ago(p.created_at)}</span>
              <span className={`tag ${p.category}`}>{p.category}</span>
            </div>
            <p className="post-body">{p.body}</p>
            <button className="link-btn small muted" onClick={() => report(p.id)}>Report</button>
          </article>
        ))}
        {!posts.length && <p className="muted">Nothing here yet. Be the first to post.</p>}
      </div>
    </div>
  );
}
