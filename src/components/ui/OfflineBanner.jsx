import { useState, useEffect } from 'react';
import { Banner } from './Banner.jsx';

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;

  return (
    <Banner variant="warning" style={{ borderRadius: 0, borderLeft: 0, borderRight: 0, margin: 0 }}>
      <strong>You are offline.</strong> Changes cannot be saved until connection is restored.
    </Banner>
  );
}

export default OfflineBanner;
