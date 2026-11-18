import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './env.js';
import { config } from './config.js';
import { httpLogger } from './logger.js';
import { errorHandler } from './http.js';
import { db } from './db.js';
import { requireAuth } from './session.js';
import { globalRateLimiter } from './rateLimit.js';
import auth from './routes/auth.js';
import posts from './routes/posts.js';
import polls from './routes/polls.js';
import messages from './routes/messages.js';
import admin from './routes/admin.js';
import reports from './routes/reports.js';
import me from './routes/me.js';
import { initServerSentry, attachServerSentryErrorHandler } from './lib/sentry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const app = express();
initServerSentry();
app.set('trust proxy', 1); // Vercel sits in front: use the real client IP for rate limits
app.disable('x-powered-by');
app.use(httpLogger);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: false
  })
);
app.use((_req, res, next) => {
  if (process.env.NODE_ENV === 'production' || config.isProd) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );
  next();
});
const serveStaticBundle = env.NODE_ENV !== 'development' || process.env.SERVE_STATIC === '1';
if (serveStaticBundle) {
  app.use(express.static(distDir));
}
app.use(express.json({ limit: '10kb' })); // tiny bodies only: stops oversized-payload abuse
app.use(cookieParser());

// Global IP limiter backed by Upstash Redis with safe in-memory fallback.
app.use('/api', globalRateLimiter);

// Maintenance mode switch: MAINTENANCE_MODE=1 blocks write methods with 503 while reads stay up.
app.use('/api', (req, res, next) => {
  const isMaintenance = process.env.MAINTENANCE_MODE === '1' || env.MAINTENANCE_MODE === '1';
  if (isMaintenance && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(503).json({
      error: 'Platform is in maintenance mode. Writes are temporarily disabled.'
    });
  }
  next();
});

// Require JSON on writes so a cross-site HTML form cannot trigger them.
app.use('/api', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'JSON only.' });
  }
  next();
});

app.get(['/.well-known/security.txt', '/security.txt'], (_req, res) => {
  res
    .type('text/plain')
    .send(
      `# S.T.I.P.S Security Policy (RFC 9116)\nContact: mailto:security@example.edu\nExpires: 2027-12-31T23:59:59.000Z\nPreferred-Languages: en\nCanonical: https://stips.example.edu/.well-known/security.txt\nPolicy: https://github.com/sameer10237/S.T.I.P.S/blob/main/docs/SECURITY.md\n`
    );
});

app.get('/api/health', async (_req, res) => {
  try {
    const { error } = await db.from('communities').select('id').limit(1);
    if (error) {
      return res.status(503).json({ ok: false, db: false, error: 'Database unavailable.' });
    }
    return res.json({ ok: true, db: true });
  } catch {
    return res.status(503).json({ ok: false, db: false, error: 'Database unavailable.' });
  }
});
app.use('/api/auth', auth);
app.use('/api/posts', requireAuth, posts);
app.use('/api/polls', requireAuth, polls);
app.use('/api/messages', requireAuth, messages);
app.use('/api/admin', requireAuth, admin);
app.use('/api/reports', requireAuth, reports);
app.use('/api/me', requireAuth, me);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
if (serveStaticBundle) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) next();
    });
  });
}
attachServerSentryErrorHandler(app);
app.use(errorHandler);

export default app;
