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

## Monitoring

`/api/health` (also checks DB reachability, cheap query), uptime monitor `[TOOL]` every 5 minutes, error tracking, Vercel logs, Supabase dashboard (DB size, connections), Upstash dashboard (requests). Alert on: 5xx rate, health failures, login-failure spikes, quota 80%.

## Backups and restore

Weekly encrypted `pg_dump` plus whatever the Supabase plan provides. **Restore drill before launch** and each term: restore the dump into a scratch project, run smoke tests, record time taken in this file.

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
