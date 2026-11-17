# Changelog

All notable changes to the **S.T.I.P.S (Student-Teacher Interaction & Polling System)** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
