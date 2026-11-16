# Architecture

```
Browser (React) --HTTPS, cookie--> Vercel
                                     ├─ static files (dist/)
                                     └─ /api/*  -> one serverless function (Express)
                                                       └─ Supabase Postgres (service role key)
                                                       └─ optional: LLM API for moderation
```

## Key decisions

**The browser never talks to Supabase.** All reads and writes go through the Express API. The API checks who you are, which community you belong to, and what your role allows. Row Level Security is switched on for every table with no policies, so even the public anon key can do nothing. This keeps the rules in one place, in code you can read.

**One Express app, one Vercel function.** `api/index.js` exports the Express app; `vercel.json` rewrites `/api/*` to it. Vercel's free plan caps the number of functions, and a single app avoids that.

**Sessions are signed cookies, not tokens in JavaScript.** A JWT holding only the user id is put in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. On every request `requireAuth` reloads the user, so a suspended account is cut off immediately.

**Community isolation.** Every query filters by `req.user.community_id`. A user from one institute cannot read, vote in or message another institute, because the id used is the one from their session, never one sent by the browser.

**Roles.** `admin` (principal/office), `teacher`, `student`. Admin can create accounts, review reports, hide content and mute or suspend people. Teachers and students can post, poll, vote and message.

**One vote per person** is enforced by the database: `poll_votes` has the primary key `(poll_id, user_id)`. Two fast clicks cannot produce two votes.

**Messaging rule.** `config.dmRule = 'teacher-student'`: a student can message teachers and the office, not other students. Change it in `server/config.js`.

**Polling, not websockets.** The Messages page refreshes every 8 seconds. Serverless functions do not hold long connections; Supabase Realtime is the upgrade path (see ROADMAP).

## Data model (summary)

`communities` 1-n `users`; `users` 1-n `posts`, `polls`, `messages`, `reports`; `polls` 1-n `poll_options`; `poll_votes` links user + poll + option. Full definitions with limits are in `supabase/schema.sql`. Text limits are enforced twice: in the API (zod) and in the database (check constraints).

## Request flow example: posting

1. `POST /api/posts` with `{ body, category }`.
2. Global IP throttle, JSON-only check, cookie auth, community check, muted check.
3. zod validates length and category.
4. Database count: fewer than 10 posts by this user in the last hour.
5. `screen()`: word filter, contact-info check, optional AI check.
6. Insert, return 201.

## Front end

`App.jsx` loads `/api/auth/me` once and shares the user in context. `/app/*` routes sit inside `Shell` (sidebar). Pages call `api.get/post` from `src/api.js`. Styling is plain CSS in `src/styles.css` using the design tokens at the top.
