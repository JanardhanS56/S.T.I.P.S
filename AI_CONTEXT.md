# S.T.I.P.S — Master AI & Developer Context

> **Mandatory Reference for Gemini & Coding Agents:**  
> This file is the primary context and source-of-truth document for any AI assistant, LLM, or developer working on **S.T.I.P.S (Student-Teacher Interaction & Polling System)**. Read this file before proposing or making changes to the codebase.

---

## 1. Project Mission & Core Invariants

S.T.I.P.S is a private, secure, and privacy-first web application designed for one college campus at a time. It provides:

1. **Community Feed:** Official campus notices, event announcements, and student posts (280 characters max) with depth-1 threaded discussions.
2. **Anonymous Polling:** 2 to 6 options, 1 to 7 day duration, with cryptographic uniqueness and one-vote-per-user enforcement.
3. **Protected Direct Messaging:** Controlled messaging between students and faculty that strictly forbids personal phone numbers and emails.

### Non-Negotiable Invariants:

- **The browser never talks to Supabase directly.** All data access routes through the Express API with the service role key server-side. Never import `server/db.js` into client-side code (`src/`). Never expose secrets in client bundles or `VITE_*` environment variables.
- **Strict Community Isolation:** Every database read and write touching community data must filter by `req.user.community_id` derived exclusively from the verified session, never from user-supplied request parameters or body fields.
- **Role Hierarchy:** Supported core roles include `admin`, `teacher`, `student`, `non_staff`, `external_guide`, and admin-defined custom roles. Administrative privileges remain strictly reserved to the `admin` role. Authorization is always enforced on the backend in route middleware (`requireAuth`, `requireAdmin`, `requireNotMuted`).
- **No Personal Contact Info:** The platform explicitly disallows personal phone numbers, email addresses, physical addresses, and locations. Posts, direct messages, and profile bios are checked by content filters for phone numbers and email addresses.
- **One Vote Per Poll:** Enforced by PostgreSQL composite primary key `(poll_id, user_id)` on `poll_votes`.
- **Session Security:** Cookies use `HttpOnly`, `SameSite=Strict`, and `Secure` in production. Token versions (`token_version`) invalidate JWTs upon password reset or `logout-all`.
- **Safe Programmatic Environment Loading:** The application never relies on CLI flags like `--env-file=.env` in runner scripts. `server/dev.js` and `scripts/dev.js` use Node's native `process.loadEnvFile` with graceful fallbacks.

---

## 2. Technical Stack & Architecture

- **Frontend:** React 18, Vite 5, React Router 6, pure CSS design tokens inspired by Swiss/Bauhaus principles (no Tailwind, no external CSS frameworks). Self-hosted `Schibsted Grotesk` and `IBM Plex Mono` fonts (zero external Google font calls).
- **Backend:** Express 4 on Node.js 20+ (Node 22 in CI). Can be run locally via `scripts/dev.js` or `server/dev.js`, and deployed to Vercel as a single serverless function via `api/index.js`.
- **Database:** Supabase PostgreSQL with 13 tables, Row-Level Security (RLS) default-deny policies, and compound indexes ensuring `<4ms` query performance.
- **Rate Limiting & Caching:** Upstash Redis (`@upstash/ratelimit` and `@upstash/redis`) with an in-memory sliding-window fallback (`server/rateLimit.js`, `server/limits.js`) and distributed feed caching with fail-open error handling (`server/cache.js`).
- **Observability:** Pino structured logger (`server/logger.js`) with PII redaction; Sentry (`@sentry/node` and `@sentry/react`) with strict client/server PII scrubbing (`scrubSentryEvent`).
- **Validation:** Zod 3 schemas validating all incoming request bodies, queries, and environment variables (`server/env.js`).
- **Testing:** 203 automated Vitest unit/API tests across 19 suites (`npm test`).

### Repository Structure:

```text
├── .github/              # GitHub Actions workflows and issue/PR templates
├── .husky/               # Git hook handlers (pre-commit, commit-msg)
├── api/                  # Vercel serverless function entrypoint (api/index.js)
├── docs/                 # Engineering, operations, and compliance documentation
│   ├── plans/            # Milestone implementation plans (Days 1–4)
│   └── prompts/          # Operator engineering prompts & recovery guides
├── public/               # Public static assets, self-hosted fonts, .well-known
├── scripts/              # Automated administrative and operational CLI utilities
├── server/               # Express backend application, routes, models, middleware
│   ├── lib/              # Shared backend utility services (audit, rate-limits, sentry)
│   └── routes/           # Domain API route handlers
├── src/                  # React Vite client application (pages, components, UI primitives)
├── supabase/             # PostgreSQL database migrations, seed data, and schema
└── tests/                # Automated Vitest API & unit test suites, mock database
```

---

## 3. Database Schema Overview (13 Tables)

1. `communities`: Campus entities (`id`, `name`, `code`, `created_at`).
2. `users`: Campus accounts (`id`, `community_id`, `username`, `display_name`, `role`, `department`, `roll_number`, `section`, `password_hash`, `status`, `token_version`, `accepted_terms_at`, `terms_version`, `failed_attempts`, `locked_until`).
3. `posts`: Feed items (`id`, `community_id`, `author_id`, `category`, `body`, `status`, `pinned_at`, `is_official`, `created_at`).
4. `post_replies`: Threaded replies (`id`, `post_id`, `author_id`, `body`, `created_at`).
5. `post_reactions`: Emoji reactions (`id`, `post_id`, `user_id`, `reaction`, `created_at`).
6. `polls`: Poll questions (`id`, `community_id`, `creator_id`, `question`, `closed_at`, `expires_at`, `created_at`).
7. `poll_options`: Options (`id`, `poll_id`, `label`, `sort_order`).
8. `poll_votes`: Anonymous votes (`poll_id`, `user_id`, `option_id`, `created_at` — composite PK `(poll_id, user_id)`).
9. `messages`: Direct messages (`id`, `community_id`, `sender_id`, `recipient_id`, `body`, `read_at`, `created_at`).
10. `user_blocks`: Bidirectional user communication blocks (`blocker_id`, `blocked_id`, `created_at`).
11. `reports`: Content flagging queue (`id`, `community_id`, `reporter_id`, `target_type`, `target_id`, `reason`, `status`, `resolution`, `created_at`).
12. `account_deletion_requests`: GDPR/DPDP deletion queue (`id`, `community_id`, `user_id`, `status`, `created_at`).
13. `audit_log`: Immutable administrative action log (`id`, `community_id`, `actor_id`, `action`, `target_type`, `target_id`, `details`, `created_at`).

---

## 4. Summary of Recent Changes & Commits

| Commit    | Scope          | Description                                                                                                                                                                                                                         |
| :-------- | :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `16e8876` | `fix(privacy)` | Aligned `GET /api/me/export` with PostgreSQL schema; omitted sensitive internal join codes; fixed pinned posts query to match `pinned_at` and `is_official`.                                                                        |
| `7927530` | `fix(limits)`  | Backed the 1/day data export rate limit with Upstash Redis; connected content auto-mute strike tracking (3 strikes in 10 minutes = temporary mute) to Redis.                                                                        |
| `3dbd6f9` | `fix(api)`     | Added detailed database error logging while returning safe 500 responses; audited and enforced strict `community_id` boundaries across all route controllers.                                                                       |
| `ef07c80` | `fix(ops)`     | Corrected Sentry error handler order (`attachServerSentryErrorHandler` placed before custom `errorHandler`); added security headers in `vercel.json` (HSTS, CSP, X-Frame-Options); excluded legal/static routes from index rewrite. |
| `b683d41` | `fix(api)`     | Refined static bundle conditional serving in `server/app.js` using parsed `env.NODE_ENV`.                                                                                                                                           |
| `bda75d9` | `fix(ops)`     | Eliminated `--env-file` CLI flags from `scripts/dev.js`, `server/dev.js`, and `package.json`, replacing them with Node's native `process.loadEnvFile` to avoid exit code 9 in CI/Docker.                                            |
| `60677a2` | `ci(ci)`       | Removed live browser E2E test job from `.github/workflows/ci.yml` so automated CI pipelines run cleanly and reliably against unit/API test suites without external database dependencies.                                           |
| `db29421` | `chore(ops)`   | Merged `fix/backend-deploy-readiness` into `main` with preserved micro-commit history.                                                                                                                                              |
| `d5efc5f` | `docs(docs)`   | Added backend audit report to `docs/BACKEND_AUDIT_REPORT.md`.                                                                                                                                                                       |
| `26389cd` | `build(deps)`  | Added GSAP and ScrollTrigger for landing page interactive animations.                                                                                                                                                               |
| `87e6230` | `refactor(ui)` | Removed inconsistent dark mode toggles across shell, auth, and legal pages in favor of a cohesive unified aesthetic.                                                                                                                |
| `ec51518` | `style(ui)`    | Implemented charcoal, steel gray, and coral color palette tokens across application styles.                                                                                                                                         |
| `e7d2c14` | `feat(ui)`     | Added Baroque Fresco interactive canvas template component with GSAP animations.                                                                                                                                                    |
| `821c0f0` | `feat(ui)`     | Connected Baroque Fresco hero to the landing page (`src/pages/Landing.jsx`).                                                                                                                                                        |
| `0041b71` | `fix(ui)`      | Added `api.delete` HTTP client alias for resource deletion in `src/api.js`.                                                                                                                                                         |
| `36400e3` | `fix(api)`     | Allowed bodiless `DELETE` requests in `server/app.js` without requiring `Content-Type: application/json`.                                                                                                                           |
| `1e28b1d` | `fix(ui)`      | Added route redirects from `/login` and `/join` to `/signin`.                                                                                                                                                                       |
| `09eaeb2` | `fix(ui)`      | Replaced raw emojis across the UI with clean, accessible Lucide React icons.                                                                                                                                                        |
| `4ddf210` | `fix(ui)`      | Normalized checkbox input styling and sizing across forms.                                                                                                                                                                          |
| `1bf89c1` | `fix(ui)`      | Upgraded card action links to ghost buttons.                                                                                                                                                                                        |
| `f98e9b1` | `fix(ui)`      | Centered feed container layout and added sidebar navigation icons.                                                                                                                                                                  |
| `7015762` | `fix(ui)`      | Refined sign-in page card layout and relocated footer links.                                                                                                                                                                        |
| `34e8394` | `fix(ui)`      | Grouped profile sections into distinct cards with compact actions.                                                                                                                                                                  |
| `b820cc0` | `fix(ui)`      | Upgraded admin dashboard layout with table action menus and aligned filters.                                                                                                                                                        |
| `15f68bb` | `feat(polls)`  | Added 10 community poll and voting templates in `src/data/pollTemplates.js`.                                                                                                                                                        |
| `ed18f0e` | `feat(polls)`  | Pre-filled poll creation modal from template selection with URL parameters (`/app/create?template=...`).                                                                                                                            |
| `e95af61` | `feat(polls)`  | Added interactive Templates Library tab view in `src/pages/Polls.jsx`.                                                                                                                                                              |
| `151609a` | `feat(ui)`     | Added action confirmation toasts (`Toast.jsx`) and async loading feedback spinners across profile updates, polls, and admin forms.                                                                                                  |
| `c7b1708` | `fix(posts)`   | Fixed reaction rate limit query in `server/limits.js` to check `user_id` column and added toast error feedback.                                                                                                                     |
| `3bef8be` | `feat(admin)`  | Expanded student profiles with `department`, `roll_number`, and `section`; added single member creation with roles (`student`, `teacher`, `non_staff`, `external_guide`, custom) and relaxed `users_role_check`.                    |
| `f06e564` | `feat(posts)`  | Implemented fail-open community feed caching in Redis (`server/cache.js`) with 15s TTL and auto-invalidation on post mutations; added test suite in `tests/unit/cache.test.js`.                                                     |

---

## 5. Development & Testing Workflow

### Running Locally:

```bash
# Full stack: frontend on http://localhost:5173, backend on http://localhost:3001
npm run dev

# Backend API server standalone
npm run dev:api

# Frontend Vite client standalone
npm run dev:client
```

### Verification Suite:

Before committing any changes, run:

```bash
npm run lint          # ESLint (must pass with 0 errors)
npm run format:check   # Prettier verification
npm test               # Vitest suite (195 tests with mock database)
npm run build          # Production bundle compilation
```

### Operational Drills:

```bash
npm run security:scan  # Gitleaks / secret scan across git history
npm run test:smoke     # Health check and public route smoke test
npm run test:backup    # PostgreSQL schema verification drill
npm run test:load      # Autocannon concurrency load test
```

---

## 6. Guidelines for Future AI Agents & Developers

1. **Check Existing Implementations First:** Before creating a new file or modifying an endpoint, inspect `server/routes/`, `server/config.js`, and `docs/CONTEXT.md`.
2. **Commit Conventions:** Follow `commitlint.config.js`:
   - Allowed types: `feat`, `fix`, `test`, `docs`, `refactor`, `perf`, `style`, `chore`, `build`, `ci`, `security`, `revert`.
   - Allowed scopes: `auth`, `posts`, `polls`, `messages`, `reports`, `admin`, `moderation`, `limits`, `db`, `api`, `ui`, `a11y`, `legal`, `privacy`, `deps`, `ci`, `tests`, `ops`, `docs`, `config`, `logging`, `progress`, `perf`, `security`, `e2e`.
   - All subjects must be lowercase with no trailing periods (max length 72 chars).
3. **Preserve Security Invariants:** Never loosen input sanitization, rate limits, PII scrubbers, or authorization middleware.
