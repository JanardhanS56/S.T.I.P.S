# Operations Runbook

## Environments and deploys

| Env                                                                                                                                                            | URL               | Source           | DB                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------- | ------------------ |
| Preview                                                                                                                                                        | per-PR Vercel URL | feature branches | staging            |
| Production                                                                                                                                                     | `[YOUR DOMAIN]`   | `main`           | production project |
| Deploy = merge to `main` (Vercel auto-deploys). Migrations are applied **before** the code that needs them (expand/contract: add columns first, remove later). |

## Environment variables

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (verify exact names in the Upstash docs), `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `SENTRY_DSN`, `MAINTENANCE_MODE`, `NODE_ENV`. Rotate `JWT_SECRET` to log everyone out. Never share keys in chat or screenshots.

## Release procedure

1. CI green on the PR. 2. Merge (no squash). 3. Run new migrations on production (`supabase db push` or the dashboard; follow the migration notes). 4. Watch Vercel deployment + `/api/health`. 5. Smoke test: sign in, post, vote, message. 6. Tag and release notes.

## Rollback

- Code: Vercel > Deployments > promote the previous deployment.
- Database: migrations are forward-only; ship a corrective migration. For data loss, restore from backup (below).
- Secrets: rotate and redeploy.

## Monitoring & Error Tracking

- **Uptime Monitoring:** External monitor polling `GET /api/health` every 5 minutes (checks Express listener and live database reachability via cheap ping query).
- **Error Tracking (Sentry):**
  - Server: Initialized in `server/lib/sentry.js` and wired into Express in `server/app.js` using `SENTRY_DSN`.
  - Client: Initialized in `src/sentry.js` and integrated with `ErrorBoundary.jsx` using `VITE_SENTRY_DSN`.
  - Release tagging: Hardened under release `stips@0.1.0`.
- **Privacy & PII Scrubbing (D4-09):**
  - All errors pass through custom `beforeSend` sanitization before transmission to Sentry.
  - Request data: `cookie`, `authorization`, and session tokens are completely excised; request bodies (`data`) are overwritten with `[REDACTED]`.
  - User identity: User identifiers (`username`, `display_name`, `email`, and `ip_address`) are permanently stripped.
  - Breadcrumb URLs: Sensitive query parameters in URL crumbs are excised.
- **Alert Thresholds:**
  - Sustained 5xx error rate > 1%.
  - `/api/health` 2 consecutive failures.
  - Failed login spikes (> 20 failed attempts in 5 minutes).
  - Database connection pool utilization > 80%.

## Backups and restore

Weekly encrypted `pg_dump` plus whatever the Supabase plan provides. **Restore drill before launch** and each term: restore the dump into a scratch project, run smoke tests, record time taken in this file.

## Query Performance & Timing Review (PERF-01, PERF-04)

Benchmark executed on live PostgreSQL engine via `EXPLAIN (ANALYZE, BUFFERS)` in migration `20261117000009_query_indexes.sql`:

| Query Path                         | Index Used                                | Planning Time | Execution Time | Target Met   |
| ---------------------------------- | ----------------------------------------- | ------------- | -------------- | ------------ |
| Feed Posts (`pinned_at`, `status`) | `posts_feed_pinned_idx`                   | 17.3 ms       | 3.88 ms        | Yes (< 50ms) |
| Category Filtered Feed (`Notice`)  | `posts_category_pinned_idx`               | 0.14 ms       | 0.09 ms        | Yes (< 20ms) |
| Unread Messages Count              | `messages_unread_recipient_idx` (partial) | 5.19 ms       | 1.18 ms        | Yes (< 10ms) |
| Direct Messaging Thread Retrieval  | `messages_pair_idx` (BitmapOr)            | 0.20 ms       | 0.08 ms        | Yes (< 10ms) |
| Admin Reports Queue (`open`)       | `reports_admin_queue_idx`                 | 2.16 ms       | 0.03 ms        | Yes (< 10ms) |

All primary tenant-isolated query paths execute well under the 50ms target for sub-second page loads.

## Load Smoke Test Benchmark (PERF-02, PERF-03)

Load smoke tests executed using `autocannon` (`npm run test:load`) over HTTP keep-alive connections:

- **Target Route:** `/api/health`
- **Concurrency:** 10 connections
- **Duration:** 5 seconds
- **Throughput:** ~222 requests/second
- **Average Latency:** 44.7 ms
- **p50 Latency:** 6.0 ms
- **Errors / Timeouts:** 0 / 0
- **Rate Limit Resilience:** Rate limiting correctly triggers HTTP 429 when single-IP thresholds (300 requests / 15 min) are exceeded.
- **Outage Handling (PERF-03):** Total database disconnection returns graceful HTTP 503 (`{ ok: false, db: false }`) with complete security headers preserved without terminating the application process.

## Incident response

| Sev                                                                                                                                                                                                                                         | Meaning                                       | First response                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1                                                                                                                                                                                                                                           | data leak, account takeover, safety emergency | contain now (maintenance mode, rotate keys, suspend paths), inform institute lead and owner, preserve logs |
| 2                                                                                                                                                                                                                                           | app down or auth broken                       | rollback or hotfix, post status                                                                            |
| 3                                                                                                                                                                                                                                           | degraded or single feature broken             | ticket, fix in normal flow                                                                                 |
| Steps: detect, triage severity, contain, communicate (institute lead, users if needed), fix, verify, write a short post-mortem (what, why, fix, prevention). Safeguarding concerns follow the institute's procedure `[NEEDS HUMAN REVIEW]`. |

## Routine tasks

Weekly: dependency PRs, `npm audit`, review reports queue stats, check quotas. Monthly: restore drill (first 3 months), review audit log, rotate admin passwords. Each term: purge per retention, new community onboarding checklist, review blocklist.

## Onboarding a new campus

1. `npm run create-admin -- "Institute" "Principal"` against production. 2. Hand credentials securely. 3. Admin adds members in bulk. 4. Share the Guidelines and User Guide. 5. Confirm consent process `[NEEDS HUMAN REVIEW]`. 6. Check reports queue after day 1.

## On-call contacts

Owner `[NAME, CONTACT]` | Institute lead `[NAME, CONTACT]` | Safeguarding `[NAME, CONTACT]`.
