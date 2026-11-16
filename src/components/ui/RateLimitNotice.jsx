import { useEffect, useState } from 'react';
import { Banner } from './Banner.jsx';

export function RateLimitNotice({
  seconds = 0,
  message = 'You have reached the temporary limit. Take a short break.',
  onReady = null,
  className = ''
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    if (!seconds || seconds <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onReady) onReady();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onReady]);

  return (
    <Banner variant="warning" className={className}>
      <div className="stack tight" style={{ gap: '4px' }}>
        <div>{message}</div>
        {remaining > 0 ? (
          <div className="mono small">
            You can try again in <strong>{remaining}s</strong>.
          </div>
        ) : (
          <div className="mono small green">You can try again now.</div>
        )}
      </div>
    </Banner>
  );
}

export default RateLimitNotice;
