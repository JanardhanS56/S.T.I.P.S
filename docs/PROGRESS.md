# Progress Log (the agent's memory)

> Update at the end of EVERY session. Keep it short and factual. Newest session on top.

## Current status

- Day: 2 (Complete)
- Branch: feat/d2-rate-limits-headers
- Last green check: npm run lint, npm test, npm run build (Day 2 complete, 147 tests passing across 13 test suites)
- First task for next session / phase: Day 3 Phase A, task D3-01 (Replies data model and migration)

## Blocked / needs owner

- None

## Decisions made this session (also add to DECISIONS.md if lasting)

- Rate limiting implemented via `@upstash/ratelimit` + `@upstash/redis` with durable sliding window algorithm and resilient in-memory fallback store (`MemoryStore`).
- Fallback invariant: missing Redis credentials or Redis connectivity failures log a structured warning (`logger.warn`) and smoothly fall back to in-memory tracking without service interruption.
- Standard headers (`Retry-After`, `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`) returned on all rate-limited responses.
- Login endpoint rate-limited on both client IP and username (10 requests per 15 min each), preventing credential stuffing and brute-force attacks across accounts.
- Per-user caps unified in `server/limits.js` (`checkUserCap`, `enforceUserCap`, and route helpers), reading config and querying exact DB counts.
- Strict Content-Security-Policy (CSP) configured in Helmet (`default-src 'self'`, `style-src 'self' https://fonts.googleapis.com 'unsafe-inline'`, `font-src 'self' https://fonts.gstatic.com`, `script-src 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`).
- Permissions-Policy header added (`camera=(), microphone=(), geolocation=(), payment=(), usb=()`).
- Strict-Transport-Security (HSTS) enforced when `config.isProd` is active.
- Non-JSON writes rejected with 415; payloads > 10kb rejected with 413.
- Maintenance mode middleware added: setting `MAINTENANCE_MODE=1` returns 503 for all write methods (`POST`, `PUT`, `PATCH`, `DELETE`) while reads (`GET`, `/api/health`) stay operational.
- RFC 9116 security policy published at `/.well-known/security.txt` and repo root `SECURITY.md`.
- RLS proof test (`tests/api/rls.test.js`) verifies deny-all security for anon Supabase clients across all 8 tables.

## Parked ideas (not in scope now)

- (none)

## Session log

### Session 8 - Day 2 Phase D (Rate Limits & HTTP Hardening: D2-11..D2-15)

- Task D2-11: Installed `@upstash/ratelimit` and `@upstash/redis`. Built `server/rateLimit.js` with Upstash sliding-window limiter, safe in-memory fallback store, standard headers, global IP limiter (300/15m), and login IP/username limiter (10/15m). Added `tests/api/rateLimit.test.js` covering RATE-01..RATE-04 (6 tests).
- Task D2-12: Unified per-user caps into `server/limits.js`. Refactored `posts.js`, `polls.js`, and `messages.js` to use cap helpers. Added `repliesPerHour` (30) and `reactionsPerHour` (120) to `server/config.js` for Day 3. Synced `docs/RATE_LIMITING_AND_ABUSE.md`.
- Task D2-13: Hardened HTTP headers with app-tailored CSP, HSTS in production, Referrer-Policy, Permissions-Policy, 413 oversized payload rejection, and 415 non-JSON rejection. Added maintenance mode switch (`MAINTENANCE_MODE=1` returns 503 on writes). Verified production bundle served locally under CSP headers. Added `tests/api/security.test.js` (8 tests) and `tests/api/maintenance.test.js` (3 tests) covering SEC-01, SEC-02, SEC-09, SEC-10.
- Task D2-14: Created `tests/api/rls.test.js` proving anon Supabase key has no access to any table (SEC-05). Added `.gitleaks.toml` secret scanning configuration. Published RFC 9116 `public/.well-known/security.txt` and root `SECURITY.md`.
- Task D2-15: Updated `docs/API.md`, `docs/CONTEXT.md`, `docs/SECURITY.md` checklist, and `docs/PROGRESS.md`. All 147 tests green across 13 suites.

- Task D2-07: Split moderation into modular normalize and detectors. Added zero-width stripping, NFKD decomposition, Cyrillic look-alike homoglyph mapping, repeat collapsing, single-letter despace run handling, spelled-out emails, and social handle detectors. Updated `tests/unit/moderation.test.js` covering MOD-01, MOD-02, MOD-03 (16 unit tests).
- Task D2-08: Added configurable spam heuristics in `server/config.js` (`spam` options) and `server/lib/spam.js` covering character/word repetition, ALL CAPS ratios, and link rejection in v1. Added unit tests for spam heuristics (11 tests).
- Task D2-09: Isolated LLM client into `server/lib/llm.js` with strict Zod schema validation, injection-resistant `<user_text>` framing without usernames or IDs, 4s timeout, and fail-open resilience. Added unit tests with mocked fetch covering provider failures (MOD-04) and injection attacks (MOD-05).
- Task D2-10: Implemented rejection counter in `server/lib/rejections.js` with 1-hour sliding window. Wired auto-mute into posts, polls, and messages routes to mute accounts at 5 rejections and insert a system report for the admin queue. Added integration test in `tests/api/posts.test.js` and unit tests covering MOD-06 (138 total tests passing).

- Task D2-04: Implemented cursor pagination, duplicate-text rejection within 10 minutes, and 3s minimum posting interval guard in `server/routes/posts.js`. Added `tests/api/posts.test.js` covering POST-01..POST-09 (10 tests).
- Task D2-05: Implemented early close endpoint `POST /api/polls/:id/close` for author and admin, divide-by-zero percentage guard in `server/routes/polls.js`. Added `tests/api/polls.test.js` covering validation, rate limits, concurrency double-vote guard, closed/foreign poll guards, and voter anonymity (POLL-01..POLL-09, 13 tests).
- Task D2-06: Added self-message rejection guard to `server/routes/messages.js`. Added `tests/api/messages.test.js` covering role boundaries, contact info detection, payload length limits, hourly rate limits, target validation, and thread isolation (MSG-01..MSG-10, 9 tests).
- Merged branch `feat/d2-content-rules` to `main`.

### Session 5 - Day 2 Phase A (Authorization and Isolation)

- Task D2-01: Created `docs/AUTHZ_MATRIX.md` detailing the 25 Express routes line-by-line across roles, status (`muted`, `suspended`), and community isolation boundaries.
- Task D2-02: Auth and isolation test suite (ISO-01..ISO-09) implemented in `tests/api/isolation.test.js` (26 tests). Upgraded `tests/helpers/mockDb.js` to full relational in-memory database with cross-community seed. Fixed foreign entity handling in `server/routes/messages.js` and `server/routes/reports.js` to return 404.
- Task D2-03: Implemented `loadInCommunity` helper in `server/http.js` and `server/db.js`. Refactored `server/routes/posts.js` and `server/routes/polls.js` to use the scoped loader.
- Merged branch `test/d2-isolation` to `main`.

### Session 4 - Phase D (Logging and CI)

- Task D1-12: Added `pino` and `pino-http`, implemented `server/logger.js` with secret/body redaction and request ID tracing, integrated into `server/app.js` and `server/http.js`. Added `tests/unit/logger.test.js`.
- Task D1-13: Replaced all `console.*` calls in server code (`server/dev.js`, `server/http.js`) with structured logger calls.
- Task D1-14: Configured GitHub Actions CI (`.github/workflows/ci.yml`), Dependabot (`.github/dependabot.yml`), PR template, and issue templates.
- Task D1-15: Extended `/api/health` with cheap DB select and 503 handling on database failure. Added `tests/api/health.test.js`.
- Task D1-16: Updated `docs/API.md`, `docs/CONTEXT.md`, and recorded Day 1 completion in `docs/PROGRESS.md`.

### Session 3 - Phase C (Tests & Auth)

- Task D1-08: Installed Vitest & Supertest, configured `vitest.config.js`, created `tests/helpers/` test harness, test runner scripts, and smoke test.
- Task D1-09: Extracted username slug helper to `server/lib/slug.js` and added unit test suites for slug and moderation (`localCheck`, `hasContactInfo`).
- Task D1-10: Created comprehensive Auth API integration test suite covering login, lockout, cookie flags, session validation, and community join.
- Task D1-11: Implemented password policy enforcement (min 10 chars, not equal to username, common password list) and session token revocation via `token_version` and `/api/auth/logout-all`.
- Merged PR #2 `test/d1-auth` to `main`.

### Session 2 - Phase B (Config & Database)

- Task D1-04: Created `server/env.js` with Zod validation. Refactored `server/config.js`, `server/db.js`, `server/moderation.js` to use validated env. Updated `.env.example` and added `.env.test.example`.
- Task D1-05: Initialized Supabase CLI, converted `schema.sql` into baseline migration `20261116000001_baseline.sql`, documented migration workflow in `docs/DATABASE.md`.
- Task D1-06: Created migration `20261116000002_users_token_version.sql`.
- Task D1-07: Created `supabase/seed.sql` and `scripts/seed-test.js` with dual communities and production safety guard.
- Merged PR #1 `feat/d1-config-db` to `main`.

### Session 1 - Phase A (Tooling & Repo Hygiene)

- Initialized local git repository linked to origin `https://github.com/JanardhanS56/S.T.I.P.S.git`.
- Committed prototype baseline on `main`.
- Task D1-01: Added build kit, docs, agent rules (`GEMINI.md`), `.editorconfig`, `.gitmessage`, MIT `LICENSE`, and linked kit in `README.md`.
- Task D1-02: Installed and configured ESLint (flat config) and Prettier; added scripts `lint`, `lint:fix`, `format`, `format:check`; formatted repository.
- Task D1-03: Installed and configured Husky, lint-staged, and commitlint. Verified pre-commit linting and commit-msg conventional commit validation.
- Merged `chore/d1-tooling` to `main` via merge commit and pushed to origin.
