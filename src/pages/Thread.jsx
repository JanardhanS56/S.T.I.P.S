import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import {
  Button,
  Badge,
  Card,
  Banner,
  EmptyState,
  Skeleton,
  RateLimitNotice,
  ReactionGroup
} from '../components/ui/index.js';

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

export default function Thread() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyErr, setReplyErr] = useState('');
  const [rateLimitErr, setRateLimitErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const res = await api.get(`/posts/${id}`);
      setPost(res.post);
      setReplies(res.replies);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyErr('');
    setRateLimitErr(null);
    setSubmitting(true);
    try {
      await api.post(`/posts/${id}/replies`, { body: replyText });
      setReplyText('');
      await load();
    } catch (e2) {
      if (e2.status === 429) {
        setRateLimitErr(e2);
      } else {
        setReplyErr(e2.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function report(targetId, type = 'post') {
    const reason = window.prompt(`Why are you reporting this ${type}?`);
    if (reason) {
      try {
        await api.post('/reports', { targetType: type, targetId, reason });
        alert('Thanks. The office will review it.');
      } catch (e2) {
        alert(e2.message);
      }
    }
  }

  async function toggleReaction(postId, kind) {
    try {
      const res = await api.post(`/posts/${postId}/reactions`, { kind });
      setPost((prev) => {
        if (!prev) return prev;
        const oldKind = prev.myReaction;
        const newKind = res.kind;
        const reactions = { ...(prev.reactions || { like: 0, thanks: 0, laugh: 0 }) };
        if (oldKind && reactions[oldKind] !== undefined) {
          reactions[oldKind] = Math.max(0, reactions[oldKind] - 1);
        }
        if (newKind && reactions[newKind] !== undefined) {
          reactions[newKind] = (reactions[newKind] || 0) + 1;
        }
        return {
          ...prev,
          reactions,
          myReaction: newKind
        };
      });
    } catch (e2) {
      if (e2.status === 429) {
        setRateLimitErr(e2);
      } else {
        alert(e2.message);
      }
    }
  }

  async function togglePin(pin) {
    try {
      await api.post(`/posts/${id}/pin`, { pinned: pin });
      await load();
    } catch (e2) {
      alert(e2.message);
    }
  }

  async function toggleOfficial(official) {
    try {
      await api.post(`/posts/${id}/official`, { official });
      await load();
    } catch (e2) {
      alert(e2.message);
    }
  }

  const left = MAX - replyText.length;

  if (loading) {
    return (
      <div className="page stack">
        <Link to="/app/feed" className="link-btn small muted" style={{ alignSelf: 'flex-start' }}>
          ← Back to feed
        </Link>
        <Card>
          <div className="row meta" style={{ marginBottom: '12px', gap: '8px' }}>
            <Skeleton width="100px" height="16px" />
            <Skeleton width="60px" height="16px" />
          </div>
          <Skeleton lines={3} />
        </Card>
      </div>
    );
  }

  if (err || !post) {
    return (
      <div className="page stack">
        <Link to="/app/feed" className="link-btn small muted" style={{ alignSelf: 'flex-start' }}>
          ← Back to feed
        </Link>
        <EmptyState
          title="Post not found"
          description={err || 'This post may have been removed or does not exist.'}
          action={
            <Link to="/app/feed" className="btn btn-dark">
              Return to feed
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="page stack">
      <Link to="/app/feed" className="link-btn small muted" style={{ alignSelf: 'flex-start' }}>
        ← Back to feed
      </Link>

      <Card as="article" variant="strong" className={post.pinned_at ? 'card-pinned' : ''}>
        <div className="row meta" style={{ flexWrap: 'wrap', gap: '8px' }}>
          {post.pinned_at && <span className="pinned-badge">📌 PINNED</span>}
          {post.is_official && <Badge variant="official">OFFICIAL</Badge>}
          <b>{post.author?.username}</b>
          {post.author?.role && (
            <Badge variant={post.author.role}>{post.author.role.toUpperCase()}</Badge>
          )}
          <span className="muted small">{ago(post.created_at)}</span>
          {post.category && (
            <Badge type="tag" variant={post.category}>
              {post.category}
            </Badge>
          )}
        </div>
        <p className="post-body" style={{ fontSize: '18px', lineHeight: 1.5 }}>
          {post.body}
        </p>
        <div
          className="row between"
          style={{
            marginTop: '14px',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <ReactionGroup
            reactions={post.reactions}
            myReaction={post.myReaction}
            onReact={(kind) => toggleReaction(post.id, kind)}
          />
          <div className="row" style={{ gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {user?.role === 'admin' && (
              <>
                <Button
                  variant="link"
                  className="muted small"
                  onClick={() => togglePin(!post.pinned_at)}
                >
                  {post.pinned_at ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  variant="link"
                  className="muted small"
                  onClick={() => toggleOfficial(!post.is_official)}
                >
                  {post.is_official ? 'Demote' : 'Make official'}
                </Button>
              </>
            )}
            <Button variant="link" className="muted small" onClick={() => report(post.id, 'post')}>
              Report
            </Button>
          </div>
        </div>
      </Card>

      <Card as="form" variant="composer" onSubmit={sendReply}>
        <label htmlFor="reply-input">Leave a reply</label>
        <textarea
          id="reply-input"
          maxLength={MAX}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Share your response..."
          rows={3}
        />
        <div className="row between">
          <span className={`mono small ${left < 30 ? 'warn' : ''}`}>{left} left</span>
          <Button
            type="submit"
            variant="dark"
            loading={submitting}
            disabled={!replyText.trim() || submitting}
          >
            Reply
          </Button>
        </div>
        {replyErr && <Banner variant="error">{replyErr}</Banner>}
        {rateLimitErr && (
          <RateLimitNotice
            seconds={rateLimitErr.retryAfter || 10}
            message={rateLimitErr.message || 'You can reply 30 times an hour. Take a short break.'}
            onReady={() => setRateLimitErr(null)}
          />
        )}
      </Card>

      <div className="stack" style={{ marginTop: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>
          Replies {replies.length > 0 ? `(${replies.length})` : ''}
        </h3>
        {replies.length === 0 ? (
          <EmptyState title="No replies yet" description="Be the first to join the conversation." />
        ) : (
          replies.map((r) => (
            <Card as="article" key={r.id}>
              <div className="row meta">
                <b>{r.author?.username}</b>
                {r.author?.role && (
                  <Badge variant={r.author.role}>{r.author.role.toUpperCase()}</Badge>
                )}
                <span className="muted small">{ago(r.created_at)}</span>
              </div>
              <p className="post-body">{r.body}</p>
              <Button variant="link" className="muted small" onClick={() => report(r.id, 'reply')}>
                Report
              </Button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
