# Progress Log (the agent's memory)

> Update at the end of EVERY session. Keep it short and factual. Newest session on top.

## Current status

- Day: 2
- Branch: feat/d2-moderation
- Last green check: npm run lint, npm test, npm run build (Day 2 Phase C complete, 138 tests passing)
- First task for next session / phase: Day 2 Phase D, task D2-11 (Upstash rate limiter wrapper server/rateLimit.js)

## Blocked / needs owner

- Upstash Redis credentials for Phase D (or note whether REST URL/token available for live smoke check)

## Decisions made this session (also add to DECISIONS.md if lasting)

- Moderation layer split modularly into `server/lib/normalize.js`, `server/lib/detectors.js`, `server/lib/spam.js`, `server/lib/llm.js`, and `server/lib/rejections.js`.
- Zero-width character stripping handles `\u200B..\u200F`, `\u202A..\u202E`, `\u2060`, `\uFEFF`, soft hyphens, and directional markers.
- NFKD normalization and homoglyph mapping catches Cyrillic lookalikes (`і`, `с`, `а`, `е`, `ѕ`, `о`), symbol substitutions (`$`, `@`, `4`, `1`, `!`, `|`), and collapsed repeated characters.
- Scunthorpe safety: whole-word matching and repeat-collapsed token checks ensure innocent words (e.g., `skill`, `skillet`, `shuttle`, `closer`) are never falsely blocked.
- Spam heuristics reject excessive repetitions (6+ identical consecutive characters, 4+ repeated words), >= 70% ALL CAPS (min 10 characters), and reject all links/URLs in v1.
- LLM moderation client strictly validates JSON output with Zod (`{ allowed: boolean, reason?: string }`), encapsulates user text in `<user_text>` tags without user metadata, enforces 4s timeout, and fails open safely on provider errors.
- Repeat moderation rejections (5 within 1 hour) automatically update user status to `muted` in the database, block content mutation with 403, and insert an open system report into the admin reports queue.

## Parked ideas (not in scope now)

- (none)

## Session log

### Session 7 - Day 2 Phase C (Moderation & Spam: D2-07..D2-10)

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
