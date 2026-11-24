# S.T.I.P.S (Student-Teacher Interaction & Polling System)

[![CI](https://github.com/JanardhanS56/S.T.I.P.S/actions/workflows/ci.yml/badge.svg)](https://github.com/JanardhanS56/S.T.I.P.S/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)
[![WCAG 2.1 AA](https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-success.svg)](docs/ACCESSIBILITY.md)

> One campus. Every voice, counted.

**S.T.I.P.S** is a private, secure, and privacy-first web application designed specifically for college campuses. It provides a community feed for official notices and student moments, anonymous polling with verifiable uniqueness, and student-teacher direct messaging that strictly protects personal contact details (phone numbers and personal emails are completely barred).

---

## Key Features

| Capability                 | Highlights                                                                                                                                                                                                                                  |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Community Feed**         | 280-character posts across Notice, Event, Meme, and Moment categories; depth-1 threaded discussions; emoji reactions; admin post pinning and official campus badges; high-speed fail-open Redis feed caching.                               |
| **Anonymous Polling**      | 2 to 6 options, 1 to 7 day durations, one vote per person enforced via database constraints. 10 interactive community poll templates with 1-click prefilling. Poll outcomes remain hidden until a vote is cast or the poll closes.          |
| **Protected Messaging**    | Direct messaging between students and teachers with automatic phone number and email address filtering. Students cannot message other students. Bidirectional user blocking.                                                                |
| **Safety & Moderation**    | Word filter blocklist, optional AI content screening, report triage queue, and automated temporary mute escalations for repeat violations.                                                                                                  |
| **User Rights & Privacy**  | First-login consent gating, self-service GDPR/DPDP-compliant JSON data export (`GET /api/me/export`), and complete account erasure and anonymization workflows.                                                                             |
| **Administration & Audit** | Single-member and bulk CSV provisioning with flexible roles (Student, Teacher, Non-staff, External guide, custom), student profile fields (Department, Roll Number, Section), one-time credentials, and immutable PostgreSQL audit logging. |
| **Accessibility (a11y)**   | Verified WCAG 2.1 AA compliance via `@axe-core/playwright` (0 critical/serious violations), skip-to-content links, modal focus traps, and 320px viewport reflow.                                                                            |
| **Observability & Ops**    | Zero-PII Sentry error monitoring (`scrubSentryEvent`), operational health checks (`GET /api/health`), blackbox smoke testing, and automated backup restore drills.                                                                          |

---

## Technical Stack

- **Frontend:** React 18, Vite, React Router 6, CSS variables with Swiss/bauhaus-inspired design tokens, Lucide React icons, GSAP/ScrollTrigger landing animation, self-hosted `Schibsted Grotesk` and `IBM Plex Mono` fonts.
- **Backend:** Express 4 on Node.js 20+, modular route controllers, Zod request body/query validation, Pino structured logging.
- **Database & Storage:** Supabase PostgreSQL with 13 tables, compound indexes for <4ms queries, and default-deny Row Level Security (RLS) on all tables.
- **Rate Limiting & Caching:** Upstash Redis with robust in-memory sliding-window fallback (`@upstash/ratelimit`) and distributed feed caching with instant mutation invalidation (`server/cache.js`).
- **Security & Hardening:** Strict Content-Security-Policy (`font-src 'self'`), `HttpOnly` `SameSite=Strict` `Secure` session cookies, JWT token version revocation (`token_version`), account lockouts after 5 consecutive failures.
- **Testing:** Vitest (203 unit and integration tests across 19 test suites), Playwright (48 E2E and accessibility checks across Desktop and Mobile Chrome), Autocannon (concurrency smoke benchmarks).

---

## Quick Start (Local Development)

### 1. Prerequisites

- **Node.js** `>= 20.0.0`
- **npm** `>= 10.0.0`
- A free **Supabase** project (or local PostgreSQL instance)
- _(Optional)_ Upstash Redis credentials and an OpenAI-compatible LLM screening API key

### 2. Installation

```bash
git clone https://github.com/JanardhanS56/S.T.I.P.S.git
cd S.T.I.P.S
npm install
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Key variables required:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_CONNECTION_STRING=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
JWT_SECRET=super-secret-random-hex-string-at-least-32-chars
PORT=3001
NODE_ENV=development
```

### 4. Database Migrations

Run the automated migration runner to apply all versioned schema updates:

```bash
npm run db:migrate
```

### 5. Bootstrap Campus Administrator

Provision your first campus community and principal account:

```bash
npm run create-admin -- "Alpha Institute" "Principal Alpha"
```

The script outputs the generated community code, administrator username, and one-time password.

### 6. Start Development Servers

Run the full-stack development environment:

```bash
npm run dev
```

- API Server: `http://localhost:3001`
- Client Web App: `http://localhost:5173` (proxies `/api` to 3001)

---

## Scripts Reference

| Command                 | Purpose                                                    |
| :---------------------- | :--------------------------------------------------------- |
| `npm run dev`           | Runs both API backend and Vite client concurrently         |
| `npm run dev:api`       | Runs the Express API server standalone                     |
| `npm run dev:client`    | Runs the Vite client development server                    |
| `npm run build`         | Compiles production assets into `dist/`                    |
| `npm run lint`          | Runs ESLint across client and server codebase              |
| `npm run lint:fix`      | Automatically fixes ESLint rule violations                 |
| `npm run format:check`  | Verifies code formatting via Prettier                      |
| `npm run format`        | Formats all source files with Prettier                     |
| `npm test`              | Executes the Vitest unit and integration test suite        |
| `npm run test:e2e`      | Runs Playwright end-to-end and accessibility tests         |
| `npm run test:load`     | Executes Autocannon concurrency load smoke test            |
| `npm run test:smoke`    | Runs blackbox production URL health & routing smoke tests  |
| `npm run test:backup`   | Runs database schema verification and backup restore drill |
| `npm run security:scan` | Scans entire git history for accidental secret leaks       |
| `npm run licenses`      | Generates `docs/THIRD_PARTY.md` license documentation      |
| `npm run db:migrate`    | Applies pending SQL migrations to Supabase database        |
| `npm run seed:large`    | Seeds realistic high-volume test dataset                   |

---

## Production Deployment

### Vercel + Supabase Architecture

1. **Database Deployment:**
   - Create a production project in Supabase.
   - Run `npm run db:migrate` against your production connection string.
2. **Web Application Hosting (Vercel):**
   - Import the repository into Vercel with the **Vite** framework preset.
   - Set build command to `npm run build` and output directory to `dist`.
   - Configure production environment variables in Vercel Project Settings:
     - `NODE_ENV=production`
     - `PORT=3001`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_CONNECTION_STRING`
     - `JWT_SECRET`
     - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
     - `SENTRY_DSN` & `VITE_SENTRY_DSN`
     - `MAINTENANCE_MODE=0`
3. **Verify Deployment:**
   - Execute the smoke test runner against the live production URL:
     ```bash
     SMOKE_URL="https://your-app.vercel.app" npm run test:smoke
     ```

For comprehensive operational guidelines, alert escalation paths, and disaster recovery procedures, see [docs/OPERATIONS.md](docs/OPERATIONS.md).

---

## Documentation Index

- **AI & Developer Onboarding:**
  - [AI_CONTEXT.md](AI_CONTEXT.md) — Master context document and ground truth for AI coding agents & new developers
  - [GEMINI.md](GEMINI.md) — Autonomous agent instructions, invariants, and prime directives
- **Core & Architecture:**
  - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — System boundaries and technical architecture
  - [docs/API.md](docs/API.md) — Full REST API endpoint reference and error codes
  - [docs/CONTEXT.md](docs/CONTEXT.md) — Source-of-truth ground truth and data models
  - [docs/DECISIONS.md](docs/DECISIONS.md) — Architectural Decision Records (ADRs)
  - [docs/DATABASE.md](docs/DATABASE.md) — Database schema, indexes, and RLS policies
- **Security & Compliance:**
  - [SECURITY.md](SECURITY.md) — Vulnerability reporting and responsible disclosure policy
  - [docs/SECURITY.md](docs/SECURITY.md) — Engineering threat model and OWASP Top 10 checklist
  - [docs/COMPLIANCE.md](docs/COMPLIANCE.md) — Legal frameworks, privacy rights, and consent records
  - [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md) — Open-source dependencies and license declarations
- **Operations & Runbooks:**
  - [docs/OPERATIONS.md](docs/OPERATIONS.md) — Incident escalation runbooks, health probe, and restore drills
  - [docs/BACKEND_AUDIT_REPORT.md](docs/BACKEND_AUDIT_REPORT.md) — Comprehensive backend readiness, security, and feature audit report
  - [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) — Pre-flight launch validation checklist
  - [docs/PROGRESS.md](docs/PROGRESS.md) — Historical milestone and engineering session log
  - [docs/plans/](docs/plans/) — Milestone roadmaps and execution plans (Days 1–4)
  - [docs/prompts/](docs/prompts/) — Engineering agent prompts and recovery guides
- **Guides:**
  - [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — End-user guide for students and faculty
  - [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) — Campus administrator handbook
  - [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines, branch model, and commit rules
  - [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — Contributor Covenant Code of Conduct

---

## License

This software is developed for educational evaluation and institution-managed deployments. See [LICENSE](LICENSE) for terms. All third-party software licenses are cataloged in [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md).
