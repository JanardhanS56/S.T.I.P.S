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
- **Role Hierarchy:** Supported roles are strictly `admin`, `teacher`, and `student`. Authorization is always enforced on the backend in route middleware (`requireAuth`, `requireAdmin`, `requireNotMuted`).
- **No Personal Contact Info:** The platform explicitly disallows personal phone numbers, email addresses, physical addresses, and locations. Posts and direct messages are checked by content filters for phone numbers and email addresses.
- **One Vote Per Poll:** Enforced by PostgreSQL composite primary key `(poll_id, user_id)` on `poll_votes`.
- **Session Security:** Cookies use `HttpOnly`, `SameSite=Strict`, and `Secure` in production. Token versions (`token_version`) invalidate JWTs upon password reset or `logout-all`.
- **Safe Programmatic Environment Loading:** The application never relies on CLI flags like `--env-file=.env` in runner scripts. `server/dev.js` and `scripts/dev.js` use Node's native `process.loadEnvFile` with graceful fallbacks.

---

## 2. Technical Stack & Architecture

- **Frontend:** React 18, Vite 5, React Router 6, pure CSS design tokens inspired by Swiss/Bauhaus principles (no Tailwind, no external CSS frameworks). Self-hosted `Schibsted Grotesk` and `IBM Plex Mono` fonts (zero external Google font calls).
- **Backend:** Express 4 on Node.js 20+ (Node 22 in CI). Can be run locally via `scripts/dev.js` or `server/dev.js`, and deployed to Vercel as a single serverless function via `api/index.js`.
- **Database:** Supabase PostgreSQL with 13 tables, Row-Level Security (RLS) default-deny policies, and compound indexes ensuring `<4ms` query performance.
- **Rate Limiting & Abuse Prevention:** Upstash Redis (`@upstash/ratelimit` and `@upstash/redis`) with an in-memory sliding-window fallback (`server/rateLimit.js`, `server/limits.js`).
- **Observability:** Pino structured logger (`server/logger.js`) with PII redaction; Sentry (`@sentry/node` and `@sentry/react`) with strict client/server PII scrubbing (`scrubSentryEvent`).
- **Validation:** Zod 3 schemas validating all incoming request bodies, queries, and environment variables (`server/env.js`).

---

## 3. Database Schema Overview (13 Tables)

1. `communities`: Campus entities (`id`, `name`, `code`, `created_at`).
2. `users`: Campus accounts (`id`, `community_id`, `username`, `display_name`, `role`, `password_hash`, `status`, `token_version`, `accepted_terms_at`, `terms_version`, `failed_attempts`, `locked_until`).
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
