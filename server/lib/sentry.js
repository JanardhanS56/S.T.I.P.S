import * as Sentry from '@sentry/node';
import { env } from '../env.js';

export function scrubSentryEvent(event) {
  if (event.request) {
    if (event.request.headers) {
      delete event.request.headers.cookie;
      delete event.request.headers.authorization;
      delete event.request.headers['x-auth-token'];
    }
    if (event.request.data) {
      event.request.data = '[REDACTED]';
    }
    if (event.request.cookies) {
      event.request.cookies = '[REDACTED]';
    }
  }
  if (event.user) {
    delete event.user.username;
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.display_name;
  }
  if (event.breadcrumbs) {
    for (const b of event.breadcrumbs) {
      if (b.data && b.data.url) {
        try {
          const u = new URL(b.data.url, 'http://localhost');
          b.data.url = u.pathname;
        } catch {
          // ignore invalid url
        }
      }
    }
  }
  return event;
}

let sentryInitialized = false;

export function initServerSentry() {
  const dsn = process.env.SENTRY_DSN || env.SENTRY_DSN;
  if (!dsn || sentryInitialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'production',
    release: 'stips@0.1.0',
    tracesSampleRate: 0.1,
    beforeSend: scrubSentryEvent
  });
  sentryInitialized = true;
}

export function attachServerSentryErrorHandler(app) {
  const dsn = process.env.SENTRY_DSN || env.SENTRY_DSN;
  if (!dsn) return;
  if (app && typeof Sentry.setupExpressErrorHandler === 'function') {
    Sentry.setupExpressErrorHandler(app);
  }
}

export { Sentry };
