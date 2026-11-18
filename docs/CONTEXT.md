# Context: Ground Truth About the Code

> If this file and the code disagree, trust the code, then fix this file in a `docs:` commit.
> See also [AI_CONTEXT.md](../AI_CONTEXT.md) for master architecture context and recent commit history.

## Stack

React 18 + Vite (JS, ESM) | Express 4 in a single Vercel function | Supabase Postgres via `@supabase/supabase-js` with the **service role key, server only** | `@upstash/ratelimit` & `@upstash/redis` with safe in-memory sliding window fallback | zod validation | bcryptjs | jsonwebtoken | helmet | Node 20+.

## Repo layout (prototype baseline)

```
api/index.js              exports the Express app for Vercel
public/                   static assets and .well-known/security.txt
server/app.js             middleware order, CSP, security headers, rate limits, route mounting
server/config.js          limits, spam rules, and rate limits (single source)
server/db.js              Supabase service-role client (server only)
server/env.js             Zod-validated environment schema
server/http.js            HttpError, h() async wrapper, parse(), loadInCommunity(), errorHandler
server/limits.js          unified per-user cap helper and route enforcers
server/rateLimit.js       Upstash Redis and in-memory sliding-window limiter wrapper
server/session.js         cookie session, requireAuth/Community/Admin/NotMuted, publicUser
server/moderation.js      facade for moderation checks and auto-mute
server/lib/               normalize.js, detectors.js, spam.js, llm.js, rejections.js, community.js
server/blocklist.txt      starter word list
server/logger.js          structured logging with pino and pino-http (redaction, x-request-id)
server/routes/            auth, posts, polls, messages, reports, admin
scripts/create-admin.js   bootstraps a community + first admin
src/                      React app (pages/, components/, api.js, styles.css)
supabase/migrations/      versioned database migrations (baseline + token_version)
vercel.json               rewrites: /api/* -> /api ; everything else -> index.html
```

## Endpoints (current)

- **Auth & Profile:** `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/logout-all`, `GET /api/auth/me`, `POST /api/auth/join`, `POST /api/auth/change-password`, `PATCH /api/auth/profile`, `POST /api/auth/consent`.
- **Privacy & User Rights:** `GET /api/me/export`, `POST /api/me/delete-request`, `GET /api/me/delete-request`.
- **Posts & Interactions:** `GET /api/posts` (cursor-paginated), `POST /api/posts`, `GET /api/posts/:id`, `POST /api/posts/:id/replies`, `POST /api/posts/:id/reactions`, `POST /api/posts/:id/pin`, `POST /api/posts/:id/official`, `DELETE /api/posts/:id`.
- **Polls:** `GET /api/polls`, `POST /api/polls`, `POST /api/polls/:id/vote`, `POST /api/polls/:id/close`.
- **Direct Messaging & Safety:** `GET /api/messages/people`, `GET /api/messages/threads`, `GET /api/messages/unread`, `GET /api/messages/with/:userId`, `POST /api/messages`, `GET /api/messages/blocks`, `POST /api/messages/blocks`, `DELETE /api/messages/blocks/:targetUserId`.
- **Reports:** `POST /api/reports`.
- **Administration:** `GET /api/admin/community`, `GET /api/admin/members`, `POST /api/admin/members`, `GET /api/admin/reports`, `POST /api/admin/reports/:id/resolve`, `GET /api/admin/deletion-requests`, `POST /api/admin/deletion-requests/:id/confirm`, `POST /api/admin/deletion-requests/:id/reject`, `POST /api/admin/users/:id/status`, `POST /api/admin/users/:id/reset-password`, `GET /api/admin/audit`.
- **System & Observability:** `GET /api/health`, `GET /.well-known/security.txt`.

## Data model (current)

13 relational PostgreSQL tables: `communities`, `users` (with `token_version`, `accepted_terms_at`, `terms_version`), `posts`, `post_reactions`, `polls`, `poll_options`, `poll_votes` (composite PK `poll_id` + `user_id`), `messages`, `user_blocks`, `reports`, `audit_log`, `account_deletion_requests`, and `applied_migrations`. Row-Level Security (RLS) is enabled across all tables with default deny-all policies for the unauthenticated `anon` key.

## Roles and rules

- **admin:** manages members, reports, deletion requests, user status, community-wide pins and official posts, views audit logs. Cannot mutate other admins.
- **teacher / student:** create posts, reply, react, create polls, vote in polls, direct message (teachers to students, students to teachers/admin; students cannot DM other students).
- **muted:** read-only permissions; creating posts, replies, polls, or messages is rejected with HTTP 403.
- **suspended:** sign-in blocked with HTTP 403; active sessions revoked.

## Limits (in `server/config.js`)

posts 10/h, replies 30/h, reactions 120/h, polls 5/day, messages 60/h, reports 20/day, export 1/day, global IP 300/15m, login 10/15m per IP and username, 5 failed logins then 10 min lock, min 3s gap between posts, duplicate text rejected within 10m, post 280 chars, message 500 chars, bio 160 chars, JSON body 10 kb (413), JSON-only writes (415), maintenance mode (`MAINTENANCE_MODE=1` blocks writes with 503).

## Status and Verification

All core requirements and Day 1–4 compliance controls are fully implemented:

- **Test Suite:** 195 Vitest unit/API tests across 18 test suites passing.
- **E2E & A11Y:** 48 Playwright tests passing across Desktop Chrome & Pixel 5 Mobile Chrome (0 serious/critical WCAG 2.1 AA violations).
- **Security:** Self-hosted fonts, zero-leak CSP (`font-src 'self'`), zero secrets in git history (`npm run security:scan`), PII-scrubbed Sentry error tracking, automated backup restore drill (`npm run test:backup` in 8.85s).

## Local commands

`npm run dev:api` (3001) | `npm run dev` (5173) | `npm test` | `npm run test:e2e` | `npm run test:smoke` | `npm run test:load` | `npm run test:backup` | `npm run security:scan` | `npm run build` | `npm run create-admin -- "Institute" "Name"`.
