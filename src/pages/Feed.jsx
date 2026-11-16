import { useEffect, useState, useCallback } from 'react';
import { api } from '../api.js';
import {
  Button,
  Chip,
  Badge,
  Card,
  Banner,
  EmptyState,
  Skeleton,
  RateLimitNotice
} from '../components/ui/index.js';

const CATS = ['Notice', 'Event', 'Meme', 'Moment'];
const MAX = 280;
const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 60000);
  return m < 1
    ? 'now'
    : m < 60
      ? `${m}m ago`
      : m < 1440
        ? `${Math.round(m / 60)}h ago`
        : `${Math.round(m / 1440)}d ago`;
};

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [text, setText] = useState('');
  const [cat, setCat] = useState('Notice');
  const [err, setErr] = useState('');
  const [rateLimitErr, setRateLimitErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const q = filter === 'All' ? '' : `?category=${filter}`;
      const res = await api.get(`/posts${q}`);
      setPosts(res.posts);
    } catch (e) {
      if (e.status === 429) {
        setRateLimitErr(e);
      } else {
        setErr(e.message);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function publish(e) {
    e.preventDefault();
    setErr('');
    setRateLimitErr(null);
    try {
      await api.post('/posts', { body: text, category: cat });
      setText('');
      await load();
    } catch (e2) {
      if (e2.status === 429) {
        setRateLimitErr(e2);
      } else {
        setErr(e2.message);
      }
    }
  }

  async function report(id) {
    const reason = window.prompt('Why are you reporting this post?');
    if (reason)
      try {
        await api.post('/reports', { targetType: 'post', targetId: id, reason });
        alert('Thanks. The office will review it.');
      } catch (e2) {
        alert(e2.message);
      }
  }

  const left = MAX - text.length;
  return (
    <div className="page">
      <h1>Community feed</h1>
      <Card as="form" variant="composer" onSubmit={publish}>
        <label htmlFor="post">Share with campus</label>
        <textarea
          id="post"
          maxLength={MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="A notice, an event, a meme, a funny moment..."
        />
        <div className="row between">
          <div className="chips">
            {CATS.map((c) => (
              <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="row">
            <span className={`mono small ${left < 30 ? 'warn' : ''}`}>{left} left</span>
            <Button type="submit" variant="dark" disabled={!text.trim()}>
              Post
            </Button>
          </div>
        </div>
        {err && <Banner variant="error">{err}</Banner>}
        {rateLimitErr && (
          <RateLimitNotice
            seconds={rateLimitErr.retryAfter || 10}
            message={rateLimitErr.message || 'You can post 10 times an hour. Take a short break.'}
            onReady={() => setRateLimitErr(null)}
          />
        )}
      </Card>

      <div className="chips filters">
        {['All', ...CATS].map((c) => (
          <Chip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {c}
          </Chip>
        ))}
      </div>

      <div className="stack">
        {loading ? (
          <div className="stack" aria-busy="true" aria-label="Loading posts">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="row meta" style={{ marginBottom: '12px', gap: '8px' }}>
                  <Skeleton width="100px" height="16px" />
                  <Skeleton width="60px" height="16px" />
                  <Skeleton width="40px" height="16px" />
                </div>
                <Skeleton lines={2} />
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((p) => (
            <Card as="article" key={p.id}>
              <div className="row meta">
                <b>{p.author.username}</b>
                <Badge variant={p.author.role}>{p.author.role.toUpperCase()}</Badge>
                <span className="muted small">{ago(p.created_at)}</span>
                <Badge type="tag" variant={p.category}>
                  {p.category}
                </Badge>
              </div>
              <p className="post-body">{p.body}</p>
              <Button variant="link" className="muted small" onClick={() => report(p.id)}>
                Report
              </Button>
            </Card>
          ))
        ) : filter !== 'All' ? (
          <EmptyState
            title={`No ${filter} posts yet`}
            description="Try selecting another category or be the first to post in this category."
          />
        ) : (
          <EmptyState
            title="Nothing here yet"
            description="Be the first to post something for your campus."
          />
        )}
      </div>
    </div>
  );
}
