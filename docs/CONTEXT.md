# Context: Ground Truth About the Code

> If this file and the code disagree, trust the code, then fix this file in a `docs:` commit.

## Stack

React 18 + Vite (JS, ESM) | Express 4 in a single Vercel function | Supabase Postgres via `@supabase/supabase-js` with the **service role key, server only** | zod validation | bcryptjs | jsonwebtoken | helmet | express-rate-limit | Node 20+.

## Repo layout (prototype baseline)

```
api/index.js              exports the Express app for Vercel
server/app.js             middleware order and route mounting
server/config.js          limits and rules (single source)
server/db.js              Supabase service-role client (server only)
server/http.js            HttpError, h() async wrapper, parse(), errorHandler
server/session.js         cookie session, requireAuth/Community/Admin/NotMuted, publicUser
server/moderation.js      word filter, contact-info check, optional LLM check
server/blocklist.txt      starter word list
server/routes/            auth, posts, polls, messages, reports, admin
scripts/create-admin.js   bootstraps a community + first admin
src/                      React app (pages/, components/, api.js, styles.css)
supabase/schema.sql       baseline schema (to be converted to migrations on Day 1)
vercel.json               rewrites: /api/* -> /api ; everything else -> index.html
```

## Endpoints (baseline)

auth: login, logout, me, join, change-password, profile. posts: list, create, delete. polls: list, create, vote. messages: people, threads, with/:id, send. reports: create. admin: community, members, reports, resolve, users/:id/status, reset-password. Health: `/api/health`. See the code for exact shapes; keep `docs/API.md` current once created.

## Data model (baseline)

communities, users, posts, polls, poll_options, poll_votes (PK poll_id+user_id), messages, reports. RLS enabled on all with no policies.

## Roles and rules

- admin: manages members, reports, status. Cannot be muted/suspended by other admins in v1.
- teacher/student: post, poll, vote, message. Students cannot DM students (`config.dmRule`).
- muted: read only. suspended: cannot sign in.

## Limits (in `server/config.js`)

posts 10/h, polls 5/day, messages 60/h, reports 20/day, 5 failed logins then 10 min lock, post 280 chars, message 500 chars, bio 160 chars, JSON body 10 kb.

## Known gaps in the baseline (to be closed by the plan)

No tests, no linter, no CI, no migrations, in-memory IP throttle, no audit log, no replies/reactions/blocks, no admin UI beyond Create, no structured logging, no error tracking, no session revocation, no data export/deletion, no CSP tuned for the app, no legal review.

## Local commands

`npm run dev:api` (3001) | `npm run dev` (5173, proxies /api) | `npm run build` | `npm run create-admin -- "Institute" "Name"`.
