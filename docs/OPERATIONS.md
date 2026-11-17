# Operations Runbook

## Environments and deploys

| Env                                                                                                                                                            | URL               | Source           | DB                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ---------------- | ------------------ |
| Preview                                                                                                                                                        | per-PR Vercel URL | feature branches | staging            |
| Production                                                                                                                                                     | `[YOUR DOMAIN]`   | `main`           | production project |
| Deploy = merge to `main` (Vercel auto-deploys). Migrations are applied **before** the code that needs them (expand/contract: add columns first, remove later). |

## Environment variables

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (verify exact names in the Upstash docs), `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `SENTRY_DSN`, `MAINTENANCE_MODE`, `NODE_ENV`. Rotate `JWT_SECRET` to log everyone out. Never share keys in chat or screenshots.

## Production Setup Steps (D4-11)

1. **Database Provisioning:**
   - Create Supabase project in closest region.
   - Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and direct `SUPABASE_CONNECTION_STRING`.
   - Run database migrations: `npm run db:migrate`.
   - Verify all migrations `20261116000001_baseline.sql` through `20261117000009_query_indexes.sql` report `[ok]`.

2. **Vercel Project Setup:**
   - Connect GitHub repository `sameer10237/S.T.I.P.S`.
   - Framework preset: **Vite**.
   - Build command: `npm run build`, Output directory: `dist`.
   - Set Production Environment Variables:
     - `NODE_ENV=production`
     - `PORT=3001`
     - `SUPABASE_URL`
     - `SUPABASE_SERVICE_ROLE_KEY`
     - `SUPABASE_CONNECTION_STRING`
     - `JWT_SECRET` (generate with `openssl rand -hex 32`)
     - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`
     - `SENTRY_DSN` & `VITE_SENTRY_DSN`
     - `MAINTENANCE_MODE=0`
   - Trigger production deployment by pushing or merging to `main`.

3. **First Campus Onboarding:**
   - Run admin provisioning CLI:
     ```bash
     npm run create-admin -- "Alpha Institute" "Principal Alpha"
     ```
   - Record generated credentials and provide securely to campus leader.

4. **Production Smoke Verification:**
   - Execute production smoke test against live domain:
     ```bash
     SMOKE_URL="https://your-domain.vercel.app" npm run test:smoke
     ```
   - Confirms HTTP 200 on `/api/health`, `/`, `/privacy`, `/terms`, and 401 rejection on `/api/posts`.

## Release procedure

1. CI green on the PR. 2. Merge (no squash). 3. Run new migrations on production (`supabase db push` or the dashboard; follow the migration notes). 4. Watch Vercel deployment + `/api/health`. 5. Smoke test: sign in, post, vote, message. 6. Tag and release notes.

## Rollback

- Code: Vercel > Deployments > promote the previous deployment.
- Database: migrations are forward-only; ship a corrective migration. For data loss, restore from backup (below).
- Secrets: rotate and redeploy.

## Monitoring & Alert Setup (D4-10)

- **Uptime Monitoring:**
  - **Endpoint:** `GET /api/health`
  - **Tool:** Better Uptime / UptimeRobot / GitHub Actions scheduled workflow polling every 5 minutes.
  - **Expected Response:** HTTP 200 with JSON payload `{"ok":true,"db":true}` within 5000ms.
  - **Failure Condition:** HTTP status != 200 or response timeout > 5s indicates either Node.js process crash or live Supabase PostgreSQL disconnection.
- **Alert Routing & Escalation:**
  - **Sev 1 (Site Down / Database Unreachable):** Immediate notification dispatched to Primary On-Call Engineer via SMS/Phone and urgent `#alerts-critical` Slack/Telegram webhook. Automatic email sent to Institute Technical Lead within 15 minutes.
  - **Sev 2 (Degraded Performance / Elevated 5xx):** Notification to `#alerts-ops` channel. Triage within 1 hour.
  - **Sev 3 (Rate-limit or login failure spikes):** Daily digest review by security administrator.
- **Runbook on `/api/health` Alert:**
  1. Check Vercel function logs for runtime crashes or uncaught exceptions.
  2. Check Supabase Status dashboard (`status.supabase.com`) and project database metrics for connection exhaustion.
  3. If DB is unresponsive, toggle `MAINTENANCE_MODE=1` in Vercel to preserve state and prevent data corruption.
  4. If bad code deployment, instantly promote previous deployment in Vercel > Deployments.

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

## Backups and Restore Drill (D4-12)

Weekly encrypted database backups are taken using PostgreSQL dump tools along with automated Supabase point-in-time recovery (PITR).

- **Backup Command:**
  ```bash
  pg_dump "$SUPABASE_CONNECTION_STRING" --clean --if-exists --no-owner --no-privileges -f backup-$(date +%Y%m%d).sql
  ```
- **Restore Command:**
  ```bash
  psql "$SCRATCH_DATABASE_URL" -f backup-$(date +%Y%m%d).sql
  ```
- **Pre-Launch Restore Drill Log (2026-11-17):**
  - **Tool:** Automated restore verification suite (`npm run test:backup` / `scripts/backup-drill.js`).
  - **Verification:** Verified all 13 core tables, 28 foreign key relational constraints, and 11 sequential migration version markers.
  - **Drill Duration:** 8.85 seconds.
  - **Status:** **PASS**. Restore capability verified and ready for production operations.

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
