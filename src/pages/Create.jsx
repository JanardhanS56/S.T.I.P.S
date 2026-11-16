import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../App.jsx';
import { Button, Chip, Card, Banner, Field } from '../components/ui/index.js';

export default function Create() {
  const { user } = useAuth();
  const [tab, setTab] = useState('post');
  const tabs = [
    ['post', 'Post'],
    ['poll', 'Poll'],
    ...(user.role === 'admin' ? [['admin', 'Admin tools']] : [])
  ];
  return (
    <div className="page">
      <h1>Create</h1>
      <div className="chips">
        {tabs.map(([k, l]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>
            {l}
          </Chip>
        ))}
      </div>
      {tab === 'post' && <PostForm />}
      {tab === 'poll' && <PollForm />}
      {tab === 'admin' && <Admin />}
    </div>
  );
}

function PostForm() {
  const nav = useNavigate();
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Notice');
  const [err, setErr] = useState('');
  async function go(e) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/posts', { body, category });
      nav('/app/feed');
    } catch (x) {
      setErr(x.message);
    }
  }
  return (
    <form className="form narrow" onSubmit={go}>
      <Field
        label="Your post"
        id="post-body"
        as="textarea"
        maxLength={280}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Up to 280 characters"
      />
      <div className="stack tight">
        <label htmlFor="post-category">Category</label>
        <select id="post-category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {['Notice', 'Event', 'Meme', 'Moment'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="small muted">
        Posts are checked for unsuitable language before they go live. Keep it kind and
        campus-related.
      </p>
      {err && <Banner variant="error">{err}</Banner>}
      <Button type="submit" variant="dark" disabled={!body.trim()}>
        Publish post
      </Button>
    </form>
  );
}

function PollForm() {
  const nav = useNavigate();
  const [question, setQuestion] = useState('');
  const [opts, setOpts] = useState(['', '', '']);
  const [days, setDays] = useState(3);
  const [err, setErr] = useState('');
  async function go(e) {
    e.preventDefault();
    setErr('');
    try {
      await api.post('/polls', {
        question,
        options: opts.map((o) => o.trim()).filter(Boolean),
        days: Number(days)
      });
      nav('/app/polls');
    } catch (x) {
      setErr(x.message);
    }
  }
  return (
    <form className="form narrow" onSubmit={go}>
      <Field
        label="Question"
        id="poll-question"
        maxLength={120}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="What should we decide?"
      />
      <fieldset>
        <legend>Options (2 to 6)</legend>
        {opts.map((o, i) => (
          <input
            key={i}
            aria-label={`Option ${i + 1}`}
            maxLength={60}
            placeholder={`Option ${i + 1}`}
            value={o}
            onChange={(e) => setOpts(opts.map((x, j) => (j === i ? e.target.value : x)))}
          />
        ))}
        {opts.length < 6 && (
          <Button type="button" variant="link" onClick={() => setOpts([...opts, ''])}>
            + Add option
          </Button>
        )}
      </fieldset>
      <div className="stack tight">
        <label htmlFor="poll-days">Closes after</label>
        <select id="poll-days" value={days} onChange={(e) => setDays(e.target.value)}>
          <option value={1}>1 day</option>
          <option value={3}>3 days</option>
          <option value={7}>7 days</option>
        </select>
      </div>
      <p className="small muted">
        Each person gets one vote. Votes cannot be changed after they are cast.
      </p>
      {err && <Banner variant="error">{err}</Banner>}
      <Button type="submit" variant="dark">
        Start poll
      </Button>
    </form>
  );
}

function Admin() {
  const [community, setCommunity] = useState(null);
  const [lines, setLines] = useState('');
  const [created, setCreated] = useState([]);
  const [reports, setReports] = useState([]);
  const [err, setErr] = useState('');
  const loadReports = () =>
    api
      .get('/admin/reports')
      .then((d) => setReports(d.reports))
      .catch(() => {});
  useEffect(() => {
    api
      .get('/admin/community')
      .then((d) => setCommunity(d.community))
      .catch(() => {});
    loadReports();
  }, []);

  async function add(e) {
    e.preventDefault();
    setErr('');
    const members = lines
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const [name, role = 'student'] = l.split(',').map((s) => s.trim());
        return { name, role: role.toLowerCase().startsWith('t') ? 'teacher' : 'student' };
      });
    try {
      setCreated((await api.post('/admin/members', { members })).created);
      setLines('');
    } catch (x) {
      setErr(x.message);
    }
  }
  async function resolve(id, action) {
    await api.post(`/admin/reports/${id}/resolve`, { action });
    loadReports();
  }
  const csv = () =>
    navigator.clipboard.writeText(
      [
        'name,role,username,password',
        ...created.map((c) => [c.name, c.role, c.username, c.password].join(','))
      ].join('\n')
    );

  return (
    <div className="stack">
      {community && (
        <div className="codebox">
          <span className="mono small green">COMMUNITY CODE</span>
          <div className="code-big">{community.code}</div>
        </div>
      )}
      <form className="form narrow" onSubmit={add}>
        <h3>Add members</h3>
        <Field
          label="One per line: name, role"
          id="members-lines"
          as="textarea"
          className="mono"
          value={lines}
          onChange={(e) => setLines(e.target.value)}
          placeholder={'Ravi K, teacher\nMeera P, student'}
        />
        {err && <Banner variant="error">{err}</Banner>}
        <Button type="submit" variant="dark" disabled={!lines.trim()}>
          Create usernames
        </Button>
      </form>
      {!!created.length && (
        <Card>
          <p>
            <b>Hand these over now.</b> Passwords are shown once and cannot be recovered. Each
            person sets their own on first sign-in.
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Username</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody>
              {created.map((c) => (
                <tr key={c.username}>
                  <td>{c.name}</td>
                  <td>{c.role}</td>
                  <td className="mono">{c.username}</td>
                  <td className="mono">{c.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button variant="dark" onClick={csv}>
            Copy as CSV
          </Button>
        </Card>
      )}
      <h3>Open reports</h3>
      {reports.map((r) => (
        <Card key={r.id}>
          <p>
            <b>{r.target_type}</b> reported by @{r.reporter.username}: {r.reason}
          </p>
          <div className="row">
            <Button variant="dark" onClick={() => resolve(r.id, 'hide')}>
              Hide content
            </Button>
            <Button variant="outline" onClick={() => resolve(r.id, 'dismiss')}>
              Dismiss
            </Button>
          </div>
        </Card>
      ))}
      {!reports.length && <p className="muted">No open reports.</p>}
    </div>
  );
}
