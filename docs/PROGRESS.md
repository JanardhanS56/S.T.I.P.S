# Progress Log (the agent's memory)

> Update at the end of EVERY session. Keep it short and factual. Newest session on top.

## Current status

- Day: 4, Phase A Complete (Legal Pages and User Rights: D4-01..D4-04 merged into main)
- Branch: main
- Last green check: npm run lint, npm test, npm run build (186 unit/API tests passing across 17 suites), Playwright E2E (14/14 passing across Desktop & Mobile Chrome)
- First task for next session / phase: Day 4, Phase B: Quality, Accessibility, and Performance (Tasks D4-05..D4-08)

## Blocked / needs owner

- None

## Decisions made this session (also add to DECISIONS.md if lasting)

- First-Login Consent Gate: Migration `20261117000007_terms_acceptance.sql` tracks `accepted_terms_at` and `terms_version` on `users`. `requireTerms` middleware denies app content actions until terms acceptance (`POST /api/auth/consent`). Frontend renders un-dismissible `ConsentModal` on first login until terms are agreed.
- Data Subject Portability (ADM-08): Endpoint `GET /api/me/export` bundled with `enforceExportCap` (1 export/day) generates complete JSON archive of personal data, authored posts, replies, poll votes, and direct messages.
- Account Erasure & Anonymization (ADM-08): Users request deletion via `POST /api/me/delete-request`. Admins review requests in `/app/admin` and confirm via `POST /api/admin/deletion-requests/:id/confirm`, which replaces user identity with `deleted-<id>` / "Deleted user", clears bio/email, invalidates credentials, revokes sessions, and records audit entry.
- Public Legal Documentation: Full compliance suite under `/privacy`, `/terms`, `/cookies`, `/guidelines`, `/accessibility`, and `/contact` with unified `PublicFooter` on unauthenticated views.

## Parked ideas (not in scope now)

- (none)

## Session log

### Session 13 - Day 4 Phase A (Legal Pages and User Rights: D4-01..D4-04)

- Task D4-01: Built `PublicFooter.jsx` with responsive grid of legal, institutional, and support links; wired into `Landing.jsx` and `Auth.jsx`. Rewrote `Legal.jsx` providing comprehensive compliance documents (`/privacy`, `/terms`, `/cookies`, `/guidelines`, `/accessibility`, `/contact`) with active cookie disclosures and institutional redressal contacts. Added source tracking annotations.
- Task D4-02: Created Supabase migration `20261117000007_terms_acceptance.sql` adding `accepted_terms_at` and `terms_version` on `users`. Implemented `requireTerms` middleware in `server/session.js` safeguarding all app endpoints. Added `POST /api/auth/consent` in `server/routes/auth.js`. Built accessible `ConsentModal.jsx` and wired into `src/App.jsx`. Added AUTH-13 unit/integration tests in `tests/api/auth.test.js`.
- Task D4-03: Implemented user data export (`GET /api/me/export`) with rate limit (1/day) in `server/routes/me.js` and `server/limits.js`. Packages user profile, authored posts, replies, poll votes, reactions, and direct messages in structured JSON. Added download trigger in `src/pages/Profile.jsx`. Added ADM-08 export tests in `tests/api/privacy.test.js`.
- Task D4-04: Created Supabase migration `20261117000008_account_deletion_requests.sql`. Added `POST /api/me/delete-request` and `GET /api/me/delete-request`. Added admin endpoints `GET /api/admin/deletion-requests`, `POST /api/admin/deletion-requests/:id/confirm` (anonymizing username to `deleted-<id>`, display name to "Deleted user", revoking active sessions, invalidating credentials), and `POST /api/admin/deletion-requests/:id/reject`. Built Deletion Requests tab in `src/pages/Admin.jsx` with confirmation modal and deletion request trigger/status banner in `src/pages/Profile.jsx`. Added anonymization flow tests in `tests/api/privacy.test.js`.
- Verified lint, all 186 unit/API tests, 14 Playwright E2E tests, and production build. Merged `feat/d4-legal-rights` into `main` without squash and pushed to `origin`.

### Session 12 - Day 3 Phase D (Admin, Audit, and E2E: D3-13..D3-17)

- Task D3-13: Created migration `20261117000006_audit_log.sql`. Built audit helper `server/lib/audit.js` with support in `mockDb.js`. Wired audit logging into member provisioning, status updates (active, muted, suspended), password resets, report resolutions (hide, dismiss), post pin/unpin, and official post marking. Built endpoint `GET /api/admin/audit` with action filtering.
- Task D3-14: Created `src/pages/Admin.jsx` with tabs (Members, Reports Queue, Audit Log, Add Members), search/role filter, confirmation modals for member status changes, password reset modal displaying one-time passwords once, report hide/dismiss with admin notes, and audit log history. Added `GET /api/admin/members` endpoint. Wired route `/app/admin` in `App.jsx` and nav item in `Shell.jsx`.
- Task D3-15: Verified ADM-01..ADM-07 in `tests/api/admin.test.js` (9 tests passing covering reporting limits, report queues, bulk member creation, password reset, status enforcement, and audit trail).
- Task D3-16: Installed `@playwright/test` and `pg`. Configured `playwright.config.js` with webServer dev harness and dual project targets (Desktop Chrome and Pixel 5 Mobile Chrome). Created migration runner `scripts/migrate.js` and applied all Day 3 migrations to live Supabase DB. Built `tests/e2e/e2e.spec.js` covering journeys E2E-01 through E2E-06. All 12 tests passing. Excluded E2E tests from `vitest.config.js`.
- Task D3-17: Added Playwright E2E job to `.github/workflows/ci.yml`. Documented all Day 3 endpoints in `docs/API.md`. Full verification passed (lint, 181 Vitest unit/API tests, 12 Playwright tests, production build). Merged `feat/d3-admin-e2e` into `main` without squash and pushed to `origin`.

### Session 11 - Day 3 Phase C (Messaging and Polls: D3-09..D3-12)

- Task D3-09: Created migration `20261117000004_user_blocks.sql`. Added block/unblock endpoints `POST /api/messages/blocks/:userId`, `DELETE /api/messages/blocks/:userId`, `GET /api/messages/blocks`. Updated `mockDb.js` to support `user_blocks`. Enforced symmetric blocking on message sending (403) and filtered people picker. Added MSG-08 integration tests in `tests/api/messages.test.js`. Added block/unblock control and disabled composer notice in `Messages.jsx`.
- Task D3-10: Created migration `20261117000005_message_read_at.sql`. Added automatic read mark on thread retrieval and explicit `POST /api/messages/with/:userId/read`. Added `GET /api/messages/unread` endpoint returning `{ total, bySender }` and `unreadCount` to `/threads`. Added MSG-09 integration tests in `tests/api/messages.test.js`. Added unread count badges in `Shell.jsx` nav and `Messages.jsx` thread list.
- Task D3-11: Implemented smooth auto-scroll to newest message with `useRef`, accessible timestamps with `<time>` elements in message bubbles, live 500-character counter, `isSending` button disabling, and Page Visibility API pausing of 8s polling in `Messages.jsx` and `Shell.jsx`.
- Task D3-12: Added accessible `role="progressbar"` attributes and percentage labels to poll results. Added remaining time countdown ("Closes in X days/hours/min" or "Closed"). Added "Close poll" early button for author and admin. Added "✓ Your vote" indicator. Updated poll creation form in `Create.jsx` to dynamically add and remove options between 2 and 6.
- Verified lint, 172 tests, and production build. Merged `feat/d3-messages-polls` into `main` without squash and pushed to `origin`.

### Session 10 - Day 3 Phase B (Social Features: D3-05..D3-08)

- Task D3-05: Created migration `post_replies`, API `POST /api/posts/:id/replies`, `GET /api/posts/:id` with replies, depth 1 enforcement, reply cap (30/hr), moderation screening. Added 5 POST-10 tests in `tests/api/posts.test.js`. Built thread page `src/pages/Thread.jsx` and reply composer.
- Task D3-06: Created migration `post_reactions`, toggle endpoint `POST /api/posts/:id/reactions`, feed and thread post reaction aggregation. Added POST-12 integration tests. Built accessible `ReactionGroup` component with `<button aria-pressed>` and wired in `Feed.jsx` and `Thread.jsx`.
- Task D3-07: Created migration `pinned_official_posts` adding `pinned_at` and `is_official` columns. Implemented admin pin/unpin and mark official endpoints in `server/routes/admin.js` and `server/routes/posts.js`. Updated feed query to order by `pinned_at desc nulls last, created_at desc`. Added POST-11 integration tests. Added official badge, pinned badge, 3px left border, and admin pin/official controls in `Feed.jsx` and `Thread.jsx`.
- Task D3-08: Added accessible "Load more" cursor pagination button in `Feed.jsx` using `nextCursor` from `/api/posts`.
- Verified lint, 169 tests, and production build. Merged `feat/d3-social` into `main` without squash and pushed to `origin`.

### Session 9 - Day 3 Phase A (UI Foundation: D3-01..D3-04)

- Task D3-01: Extracted and tested reusable components in `src/components/ui/`: `Button`, `Chip`, `Badge`, `Card`, `Field`, `Banner`, `Toast`, `EmptyState`, `Skeleton`, `Modal`. Refactored `Feed.jsx`, `Polls.jsx`, `Messages.jsx`, `Create.jsx`, `Auth.jsx`, and `Profile.jsx` to use shared components page-by-page with atomic commits.
- Task D3-02: Upgraded app shell (`src/components/Shell.jsx` & `src/styles.css`): mobile top bar with menu button (< 760px), skip-to-content link, route-based page titles (`document.title`), and focus shifting to `<h1>` on route change (`RouteFocusAndTitle`).
- Task D3-03: Created `ErrorBoundary.jsx` (500 crash screen with calm reload and home buttons), `NotFound.jsx` (404 page), `RateLimitNotice.jsx` (counting down `Retry-After` seconds politely), and `OfflineBanner.jsx` (detecting offline state). Enhanced `src/api.js` to throw `ApiError` with `status` and `retryAfter`.
- Task D3-04: Wired skeleton loaders, empty states, and friendly rate limit banners into `Feed.jsx`, `Polls.jsx`, and `Messages.jsx`.
- Verified lint, 158 tests, and production build. Merged `feat/d3-ui-foundation` into `main` without squash and pushed to `origin`.

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
