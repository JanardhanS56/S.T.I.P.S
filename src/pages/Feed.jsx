import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Button,
  Chip,
  Badge,
  Card,
  Banner,
  EmptyState,
  Skeleton,
  RateLimitNotice,
  ReactionGroup
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
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [text, setText] = useState('');
  const [cat, setCat] = useState('Notice');
  const [isOfficial, setIsOfficial] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [err, setErr] = useState('');
  const [rateLimitErr, setRateLimitErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const q = filter === 'All' ? '' : `?category=${filter}`;
      const res = await api.get(`/posts${q}`);
      setPosts(res.posts);
      setNextCursor(res.nextCursor);
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

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const q =
        filter === 'All' ? `?before=${nextCursor}` : `?category=${filter}&before=${nextCursor}`;
      const res = await api.get(`/posts${q}`);
      setPosts((prev) => [...prev, ...res.posts]);
      setNextCursor(res.nextCursor);
    } catch (e) {
      if (e.status === 429) {
        setRateLimitErr(e);
      } else {
        alert(e.message);
      }
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function publish(e) {
    e.preventDefault();
    setErr('');
    setRateLimitErr(null);
    try {
      await api.post('/posts', {
        body: text,
        category: cat,
        ...(user?.role === 'admin' && isOfficial ? { is_official: true } : {})
      });
      setText('');
      setIsOfficial(false);
      await load();
    } catch (e2) {
      if (e2.status === 429) {
        setRateLimitErr(e2);
      } else {
        setErr(e2.message);
      }
    }
  }

  async function togglePin(postId, pin) {
    try {
      await api.post(`/posts/${postId}/pin`, { pinned: pin });
      await load();
    } catch (e2) {
      alert(e2.message);
    }
  }

  async function toggleOfficial(postId, official) {
    try {
      await api.post(`/posts/${postId}/official`, { official });
      await load();
    } catch (e2) {
      alert(e2.message);
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

  async function toggleReaction(postId, kind) {
    try {
      const res = await api.post(`/posts/${postId}/reactions`, { kind });
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const oldKind = p.myReaction;
          const newKind = res.kind;
          const reactions = { ...(p.reactions || { like: 0, thanks: 0, laugh: 0 }) };
          if (oldKind && reactions[oldKind] !== undefined) {
            reactions[oldKind] = Math.max(0, reactions[oldKind] - 1);
          }
          if (newKind && reactions[newKind] !== undefined) {
            reactions[newKind] = (reactions[newKind] || 0) + 1;
          }
          return {
            ...p,
            reactions,
            myReaction: newKind
          };
        })
      );
    } catch (e2) {
      if (e2.status === 429) {
        setRateLimitErr(e2);
      } else {
        alert(e2.message);
      }
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
          <div className="row" style={{ alignItems: 'center', gap: '12px' }}>
            {user?.role === 'admin' && (
              <label
                className="row"
                style={{
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  userSelect: 'none'
                }}
              >
                <input
                  type="checkbox"
                  checked={isOfficial}
                  onChange={(e) => setIsOfficial(e.target.checked)}
                />
                <span>Official</span>
              </label>
            )}
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
            <Card as="article" key={p.id} className={p.pinned_at ? 'card-pinned' : ''}>
              <div className="row meta" style={{ flexWrap: 'wrap', gap: '8px' }}>
                {p.pinned_at && <span className="pinned-badge">📌 PINNED</span>}
                {p.is_official && <Badge variant="official">OFFICIAL</Badge>}
                <b>{p.author.username}</b>
                <Badge variant={p.author.role}>{p.author.role.toUpperCase()}</Badge>
                <span className="muted small">{ago(p.created_at)}</span>
                <Badge type="tag" variant={p.category}>
                  {p.category}
                </Badge>
              </div>
              <p className="post-body">{p.body}</p>
              <div
                className="row between"
                style={{
                  marginTop: '12px',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <ReactionGroup
                  reactions={p.reactions}
                  myReaction={p.myReaction}
                  onReact={(kind) => toggleReaction(p.id, kind)}
                />
                <div
                  className="row"
                  style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
                >
                  {user?.role === 'admin' && (
                    <>
                      <Button
                        variant="link"
                        className="muted small"
                        onClick={() => togglePin(p.id, !p.pinned_at)}
                      >
                        {p.pinned_at ? 'Unpin' : 'Pin'}
                      </Button>
                      <Button
                        variant="link"
                        className="muted small"
                        onClick={() => toggleOfficial(p.id, !p.is_official)}
                      >
                        {p.is_official ? 'Demote' : 'Make official'}
                      </Button>
                    </>
                  )}
                  <Link to={`/app/feed/${p.id}`} className="link-btn small">
                    Replies
                  </Link>
                  <Button variant="link" className="muted small" onClick={() => report(p.id)}>
                    Report
                  </Button>
                </div>
              </div>
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
        {nextCursor && (
          <div className="row center" style={{ justifyContent: 'center', marginTop: '16px' }}>
            <Button
              variant="outline"
              loading={loadingMore}
              onClick={loadMore}
              style={{ minWidth: '160px' }}
            >
              Load more
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
