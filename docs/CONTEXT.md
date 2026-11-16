# Context: Ground Truth About the Code

> If this file and the code disagree, trust the code, then fix this file in a `docs:` commit.

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

auth: login, logout, logout-all, me, join, change-password, profile. posts: list (cursor-paginated), create, delete. polls: list, create, vote, close. messages: people, threads, with/:id, send. reports: create. admin: community, members, reports, resolve, users/:id/status, reset-password. Security: `/.well-known/security.txt`. Health: `/api/health` ({ok, db}). See `docs/API.md`.

## Data model (current)

communities, users (with token_version), posts, polls, poll_options, poll_votes (PK poll_id+user_id), messages, reports. RLS enabled on all with no policies (deny-all anon client).

## Roles and rules

- admin: manages members, reports, status. Cannot be muted/suspended by other admins in v1.
- teacher/student: post, poll, vote, message. Students cannot DM students (`config.dmRule`).
- muted: read only. suspended: cannot sign in.

## Limits (in `server/config.js`)

posts 10/h, replies 30/h, reactions 120/h, polls 5/day, messages 60/h, reports 20/day, global IP 300/15m, login 10/15m per IP and username, 5 failed logins then 10 min lock, min 3s gap between posts, duplicate text rejected within 10m, post 280 chars, message 500 chars, bio 160 chars, JSON body 10 kb (413), JSON-only writes (415), maintenance mode (`MAINTENANCE_MODE=1` blocks writes with 503).

## Known gaps in the baseline (to be closed by subsequent day plans)

In-memory IP throttle (Upstash planned for Day 2), no audit log, no replies/reactions/blocks (Day 3), no admin UI beyond Create, no error tracking (Sentry), no data export/deletion, no CSP tuned for the app (Day 2), no legal review (Day 4).

## Local commands

`npm run dev:api` (3001) | `npm run dev` (5173, proxies /api) | `npm run build` | `npm run create-admin -- "Institute" "Name"`.
