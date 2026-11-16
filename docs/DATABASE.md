# Database Plan (Supabase Postgres)

## Principles
- All access through the Express API with the service role key. RLS is **on with no policies** as a deny-all net for the anon key.
- Schema changes only through versioned migration files. Never edit a live table by hand without a migration capturing it.
- Constraints in the database, not only in code: lengths, enums, uniqueness, foreign keys.
- Every list query has an index and a limit.

## Migration workflow (Day 1)
1. Install the Supabase CLI (verify the install method in the official docs) and `supabase init`.
2. Convert `supabase/schema.sql` into `supabase/migrations/<timestamp>_baseline.sql` (one file, unchanged).
3. Each later change is a new migration file named `<timestamp>_<what>.sql`. Never edit an applied migration.
4. Apply locally (`supabase db reset` against a local stack, if Docker is available) or against a **separate staging project** first, then production.
5. Keep `supabase/seed.sql` for dev data only. Never seed production with fake users.

## Environments
| Env | Purpose | DB |
| --- | --- | --- |
| local | development | local Supabase stack or a personal dev project |
| staging | previews, E2E tests | separate Supabase project |
| production | real campus | separate Supabase project |
Three projects, three sets of keys, never shared.

## Planned migrations
| Day | Migration | Contents |
| --- | --- | --- |
| 1 | `baseline` | existing tables |
| 1 | `users_token_version` | `users.token_version int default 0` (for "sign out everywhere") |
| 2 | `rate_limit_events` (optional) | fallback event table if Upstash is not used |
| 3 | `post_replies` | `parent_id uuid references posts(id)`, `reply_count` via query; index `(parent_id, created_at)` |
| 3 | `reactions` | `post_reactions(post_id, user_id, kind)` PK `(post_id,user_id)`; kinds limited by check |
| 3 | `pinned_posts` | `posts.pinned_at timestamptz`, `posts.is_official boolean` (admin only) |
| 3 | `blocks` | `user_blocks(blocker_id, blocked_id)` PK both |
| 3 | `message_read` | `messages.read_at timestamptz`; index `(recipient_id, read_at)` |
| 3 | `poll_options_anonymous` | `polls.is_anonymous boolean default true`; voter identities never exposed in API |
| 3 | `audit_log` | `audit_log(id, community_id, actor_id, action, target_type, target_id, meta jsonb, created_at)` |
| 4 | `deletion_requests` | `account_deletion_requests(user_id, requested_at, status)` |
| 4 | `indexes_review` | indexes from query review (see below) |

## Index checklist
`posts(community_id,status,created_at desc)` | `posts(parent_id,created_at)` | `polls(community_id,created_at desc)` | `poll_votes(poll_id)` | `messages(community_id,sender_id,recipient_id,created_at desc)` | `messages(recipient_id,read_at)` | `reports(community_id,status,created_at)` | `audit_log(community_id,created_at desc)` | `users(community_id,status)`.
Run `EXPLAIN` on the feed, polls and thread queries with realistic seed data before Day 4 ends.

## Row Level Security
- RLS stays enabled on every table, with no policies. Add a test that the anon key cannot read or write any table (see `TESTING.md`).
- If realtime or direct client access is ever introduced, write explicit per-table policies scoped by community first, and update `DECISIONS.md`.

## Data lifecycle
| Data | Retention (owner to confirm `[TARGET]`) |
| --- | --- |
| Posts, polls, replies | until deleted or account removed |
| Messages | `[TARGET: e.g. 1 academic year]`, then purge |
| Reports | `[TARGET]` after resolution |
| Audit log | `[TARGET: at least 1 year]` |
| Deleted accounts | content anonymized or removed within `[TARGET]` days of request |
Implement purge as a scheduled job (Vercel Cron or Supabase scheduled function; verify availability on the free plan) and document it in `OPERATIONS.md`.

## Backups
- Check what the Supabase plan provides (daily backups, point-in-time recovery are plan-dependent; verify in the dashboard/docs).
- Regardless of plan: a weekly `pg_dump` to encrypted storage owned by the institute, and **one tested restore** before launch.

## Seed data for tests
`supabase/seed.sql` (or a script) creates two communities (A and B), an admin, two teachers and four students each, a few posts, polls, messages. Tests rely on two communities to prove isolation.

## Naming
snake_case, plural table names, `*_id` foreign keys, `created_at timestamptz default now()`.
