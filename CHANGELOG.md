# Changelog

All notable changes to the **S.T.I.P.S (Student-Teacher Interaction & Polling System)** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Community Poll & Voting Templates:** Added 10 pre-configured, categorized polling templates in `src/data/pollTemplates.js` (CR election, event scheduling, faculty appreciation, event contribution, hackathon themes, study groups) with an interactive "Templates Library" tab in `src/pages/Polls.jsx` and 1-click pre-filling in `src/pages/Create.jsx`.
- **Expanded Student Profiles:** Added `department` (up to 60 chars), `roll_number` (alphanumeric/numeric up to 40 chars), and `section` (classroom/section identifier up to 40 chars) to the `users` table and updated `src/pages/Profile.jsx` with input controls and profile badge chips.
- **Admin Member Creation & Flexible Roles:** Added single-member provisioning form in `src/pages/Admin.jsx` with default `Student` role and selector for `Student`, `Teacher`, `Non-staff`, `External guide`, and `Custom role...`. Relaxed DB constraint to `users_role_check check (char_length(role) between 1 and 40)` via migration `20261124000001_student_profile_fields_and_roles.sql`.
- **Distributed Community Feed Caching:** Added fail-open in-memory/Redis feed caching (`server/cache.js`) for `GET /api/posts` with a 15-second TTL and automatic cache invalidation upon post creation, deletion, reactions, pinning, and official flagging. Covered with test suite in `tests/unit/cache.test.js`.
- **Action Confirmation Toasts & Loading State:** Integrated temporary toast notifications (`src/components/ui/Toast.jsx`) confirming database updates across profile edits, password resets, poll voting, and post reactions, along with async loading spinner indicators.
- **Baroque Fresco Landing Page Experience:** Added an interactive canvas hero animation (`src/components/BaroqueFresco.jsx`) powered by GSAP and ScrollTrigger on `src/pages/Landing.jsx`.
- **Lucide React Icons:** Replaced raw emojis across sidebar navigation, feed cards, reactions, and administrative tables with accessible Lucide React icons.
- **AI & Developer Context Handbook:** Added `AI_CONTEXT.md` as the authoritative source-of-truth reference for AI assistants, LLMs, and new developers.
- **Upstash Redis Auto-Mute & Export Limits:** Backed the 1/day GDPR/DPDP export rate limit and the 3-strikes-in-10-minutes content rejection auto-mute escalation with distributed Upstash Redis storage.
- **Deployment Security Headers:** Added HSTS (`max-age=31536000`), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Permissions-Policy in `vercel.json`.

### Fixed

- **Reaction Rate Limit User Column (`server/limits.js`):** Fixed query in `enforceReactionCap` to use `user_id` instead of `author_id`, resolving 500 errors when toggling post reactions.
- **Bodiless DELETE Requests (`server/app.js`):** Relaxed `Content-Type: application/json` enforcement on bodiless `DELETE` requests so client resource deletions complete cleanly without 415 errors.
- **API Client Delete Helper (`src/api.js`):** Added `api.delete` alias matching standard REST conventions.
- **Legacy Route Redirects (`src/App.jsx`):** Added automatic redirects from `/login` and `/join` to `/signin`.
- **Form Element Normalization (`src/styles.css`):** Normalized checkbox inputs, card actions, ghost buttons, and centered feed layout.
- **Data Export Schema Alignment (`server/routes/me.js`):** Aligned export queries with PostgreSQL schema columns (`pinned_at`, `is_official`) and omitted campus join codes from user data archives.
- **Sentry Error Handler Pipeline (`server/app.js`):** Repositioned Sentry's `attachServerSentryErrorHandler` before the application's final error middleware so unhandled exceptions are recorded before HTTP 500 responses are sent.
- **Static Asset SPA Routing (`vercel.json`):** Excluded `/.well-known/security.txt`, `/security.txt`, and `/fonts/` from Vite client-side SPA rewrites.
- **Programmatic Environment Loading (`scripts/dev.js`, `server/dev.js`):** Replaced `--env-file` CLI arguments with Node's native `process.loadEnvFile` inside a `try/catch` wrapper, resolving Node exit code 9 crashes in CI/Docker environments where `.env` is absent.
- **CI Pipeline Reliability (`.github/workflows/ci.yml`):** Streamlined automated GitHub Actions checks to focus on standalone, reproducible test suites (203 Vitest API/unit tests across 19 suites, ESLint, Prettier, production build, Gitleaks).

## [0.1.0] - 2026-11-17

### Added

- **Legal and User Rights Portal (Phase A):**
  - Comprehensive public legal pages for `/privacy`, `/terms`, `/cookies`, `/guidelines`, `/accessibility`, and `/contact` with source tracking annotations.
  - Mandatory first-login consent modal gating app features until terms and privacy policy are accepted (`terms_version` tracking).
  - User self-service JSON data archive export (`GET /api/me/export`) with a 1/day rate limit.
  - Account deletion and anonymization request pipeline (`POST /api/me/delete-request`), administrative queue with confirmation modal, user anonymization to `deleted-<id>`, and active session revocation.

- **Accessibility and Hardening (Phase B):**
  - Full automated WCAG 2.1 AA accessibility auditing via `@axe-core/playwright` across Desktop and Pixel 5 Mobile Chrome with 0 serious or critical violations.
  - Keyboard navigation passes: skip-to-content links, modal focus traps, Escape key dismissal, and 320px viewport reflow without two-dimensional scrolling.
  - Self-hosted `Schibsted Grotesk` and `IBM Plex Mono` `.woff2` font subsets in `public/fonts/` with `font-display: swap`.
  - Tightened Content-Security-Policy (CSP) enforcing `font-src 'self'` and `style-src 'self' 'unsafe-inline'`.
  - High-frequency query review and PostgreSQL compound indexes (`20261117000009_query_indexes.sql`), cutting query execution times to < 4ms.
  - Route-level code-splitting and lazy-loading for the Admin dashboard (`Admin.jsx`), reducing the initial application bundle size.
  - High-concurrency load smoke benchmark script (`npm run test:load`) sustaining 220+ req/s with 0 errors.

- **Observability and Operations (Phase C):**
  - Client and server Sentry error tracking with strict PII scrubbing (`scrubSentryEvent`), removing auth headers, session cookies, emails, usernames, display names, and request bodies before dispatch.
  - Standardized health monitoring probe (`GET /api/health`) reporting system uptime and database connectivity.
  - Comprehensive Sev 1/2/3 incident runbooks and deployment guides in `docs/OPERATIONS.md`.
  - Blackbox smoke test automation (`npm run test:smoke`) validating public, legal, and protected application endpoints.
  - Database schema integrity and backup restore drill script (`npm run test:backup`) verifying 13 tables, 28 foreign key constraints, and 11 applied migrations.

- **Core Application Features (Days 1–3):**
  - Closed campus communities with isolated relational data models and default-deny row-level security.
  - Community feed supporting 280-character posts in four categories (Notice, Event, Meme, Moment), depth-1 threaded replies, emoji reactions, and admin pinning / official badges.
  - Cryptographically anonymous polling with 2–6 options, 1–7 day durations, one-vote-per-person enforcement, and hidden results until cast or closed.
  - Contact-safe direct messaging between students and teachers with automatic phone/email contact detail redaction and bidirectional user blocking.
  - Multi-tier rate limiting via Upstash Redis with safe in-memory sliding-window fallback.
  - Multi-layer content moderation combining blocklist filtering, contact detection, repetition damping, and automated mute escalation upon repeated violations.
  - Administrative management dashboard featuring member roster provisioning, one-time credential generation, report triage queue, and immutable audit logging.

### Security

- Session management with `HttpOnly`, `Secure`, `SameSite=Strict` cookies and JWT token version invalidation (`logout-all` and password reset revocation).
- Account lockout after 5 consecutive failed sign-in attempts for 10 minutes.
- Automated git history secret scanner (`npm run security:scan`) with zero leaks detected.
- Request payload size capping (10 kb JSON ceiling) and JSON-only write enforcement.

[Unreleased]: https://github.com/sameer10237/S.T.I.P.S/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/sameer10237/S.T.I.P.S/releases/tag/v0.1.0
