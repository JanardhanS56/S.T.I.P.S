import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './http.js';
import { requireAuth } from './session.js';
import auth from './routes/auth.js';
import posts from './routes/posts.js';
import polls from './routes/polls.js';
import messages from './routes/messages.js';
import admin from './routes/admin.js';
import reports from './routes/reports.js';

const app = express();
app.set('trust proxy', 1); // Vercel sits in front: use the real client IP for rate limits
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // tiny bodies only: stops oversized-payload abuse
app.use(cookieParser());

// Blanket throttle per IP. NOTE: in-memory, so counted per serverless instance. The strict
// per-user caps (posts, polls, messages) live in the database and are exact. See docs/SECURITY.md.
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please slow down.' }
  })
);

// Require JSON on writes so a cross-site HTML form cannot trigger them.
app.use('/api', (req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ error: 'JSON only.' });
  }
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', auth);
app.use('/api/posts', requireAuth, posts);
app.use('/api/polls', requireAuth, polls);
app.use('/api/messages', requireAuth, messages);
app.use('/api/admin', requireAuth, admin);
app.use('/api/reports', requireAuth, reports);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
app.use(errorHandler);

export default app;
