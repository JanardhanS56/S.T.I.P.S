import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Button from './ui/Button.jsx';
import Banner from './ui/Banner.jsx';

export default function ConsentModal({ onAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) return;
    setBusy(true);
    setError(null);
    try {
      await api.post('/auth/consent');
      if (onAccepted) onAccepted();
    } catch (err) {
      setError(err.message || 'Could not save consent. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px'
        }}
      >
        <div className="mono small green" style={{ marginBottom: '8px' }}>
          CAMPUS COMMUNITY NOTICE
        </div>
        <h2 id="consent-title" style={{ marginTop: 0, marginBottom: '16px' }}>
          Welcome to S.T.I.P.S
        </h2>

        <p className="lead" style={{ fontSize: '15px', lineHeight: 1.6, marginBottom: '16px' }}>
          Before entering the campus square, please review our core principles. S.T.I.P.S is a
          private, closed-loop platform for verified campus members only:
        </p>

        <ul
          style={{ paddingLeft: '20px', lineHeight: 1.6, marginBottom: '20px', fontSize: '14px' }}
        >
          <li>
            <strong>Privacy by design:</strong> Zero behavioral tracking, zero advertising, and no
            phone numbers or personal emails collected.
          </li>
          <li>
            <strong>Family-friendly &amp; constructive:</strong> All posts, polls, and messages are
            screened to maintain a respectful, safe campus environment.
          </li>
          <li>
            <strong>Accountability:</strong> The campus office acts as data fiduciary, reviews
            reported safety issues, and moderates the community.
          </li>
        </ul>

        <div
          style={{
            background: 'var(--paper-2, #f5f5f3)',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            border: '1px solid var(--line)'
          }}
        >
          Please read our policies:{' '}
          <Link
            to="/terms"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', marginRight: '12px' }}
          >
            Terms of Use
          </Link>
          <Link
            to="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', marginRight: '12px' }}
          >
            Privacy Policy
          </Link>
          <Link
            to="/guidelines"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', marginRight: '12px' }}
          >
            Community Guidelines
          </Link>
          <Link
            to="/cookies"
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline' }}
          >
            Cookies
          </Link>
        </div>

        {error && (
          <Banner variant="error" style={{ marginBottom: '16px' }}>
            {error}
          </Banner>
        )}

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <input
              type="checkbox"
              id="consent-checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '3px', width: '18px', height: '18px' }}
            />
            <span>
              I understand the community guidelines and agree to the <strong>Terms of Use</strong>{' '}
              and <strong>Privacy Policy</strong> for this campus network.
            </span>
          </label>

          <Button
            type="submit"
            variant="dark"
            size="lg"
            disabled={!agreed || busy}
            loading={busy}
            style={{ width: '100%' }}
          >
            Agree and Continue to Campus
          </Button>
        </form>
      </div>
    </div>
  );
}
