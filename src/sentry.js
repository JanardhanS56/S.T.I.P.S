import * as Sentry from '@sentry/react';

export function initClientSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'production',
    release: 'stips@0.1.0',
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.user) {
        delete event.user.username;
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    }
  });
}

export { Sentry };
