import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

const app = express();
app.set('trust proxy', 1); // Vercel sits in front: use the real client IP for rate limits
app.disable('x-powered-by');
app.use(httpLogger);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
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
app.use(express.static(distDir));
app.use(express.json({ limit: '10kb' })); // tiny bodies only: stops oversized-payload abuse
app.use(cookieParser());

// Global IP limiter backed by Upstash Redis with safe in-memory fallback.
app.use('/api', globalRateLimiter);

// Require JSON on writes so a cross-site HTML form cannot trigger them.
app.use('/api', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'JSON only.' });
  }
  next();
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
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});
app.use(errorHandler);

export default app;
