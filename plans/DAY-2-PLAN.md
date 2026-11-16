# Day 2 Plan: Backend Hardening

**Theme:** prove the backend is correct, isolated, abuse-resistant and well-fenced.
**Branches:** `test/d2-isolation` (A), `feat/d2-content-rules` (B), `feat/d2-moderation` (C), `feat/d2-rate-limits-headers` (D).
**Read first:** `GEMINI.md`, `docs/PROGRESS.md`, `docs/SECURITY.md`, `docs/RATE_LIMITING_AND_ABUSE.md`, `docs/TESTING.md` (cases ISO, POST, POLL, MSG, MOD, RATE, SEC).

## Owner prerequisites
Upstash Redis database created; REST URL and token in `.env`, `.env.test` and Vercel (preview). LLM key optional.

## Phase A: Authorization and isolation (about 2 h)
| ID | Task | Acceptance | Expected commits |
| --- | --- | --- | --- |
| D2-01 | Route authorization matrix: write `docs/AUTHZ_MATRIX.md` (route x role x muted/suspended) from the real code | matches code line by line | `docs(api): add authorization matrix` |
| D2-02 | ISO-01..ISO-09 tests across community A and B; fix gaps (return 404 for foreign objects) | all green | `test(auth): cover admin route access by role (ISO-01, ISO-02)`, `test(api): cover cross-community reads (ISO-03)`, `test(api): cover foreign object ids (ISO-04, ISO-05)`, `fix(api): return 404 for foreign objects`, `test(api): ignore client supplied ids (ISO-06)`, `test(admin): cover cross-community admin actions (ISO-07)`, `test(api): cover muted and no-community users (ISO-08, ISO-09)` |
| D2-03 | Central helpers: `loadInCommunity(table, id, req)` to remove duplicated checks | behavior unchanged, tests still green | `refactor(api): add community-scoped loader`, `refactor(posts): use scoped loader`, `refactor(polls): use scoped loader` |
**Exit:** ISO suite green; PR merged.

## Phase B: Posts, polls, messages rules (about 2.5 h)
| ID | Task | Acceptance | Expected commits |
| --- | --- | --- | --- |
| D2-04 | Posts: cursor pagination (`?before=<iso>&limit<=50`), duplicate-text guard, min gap 3 s; tests POST-01..09 | green | `feat(posts): add cursor pagination`, `feat(posts): reject duplicate text within 10 minutes`, `test(posts): cover creation and limits (POST-01..04)`, `test(posts): cover moderation and deletion (POST-06, POST-07)`, `test(posts): cover xss payload storage (POST-08)`, `test(posts): cover pagination (POST-09)` |
| D2-05 | Polls: anonymity guarantee (no voter ids anywhere), early close by author/admin, results rules; tests POLL-01..09 incl. **parallel double-vote test** | green | `feat(polls): add close endpoint for author and admin`, `test(polls): cover validation and limits (POLL-01..03)`, `test(polls): cover single vote and concurrency (POLL-04)`, `test(polls): cover closed and foreign polls (POLL-05)`, `test(polls): cover results visibility (POLL-06, POLL-07)`, `fix(polls): avoid divide by zero in results (POLL-09)` |
| D2-06 | Messages: self-DM block, suspended/foreign target, thread privacy; tests MSG-01..07, MSG-10 | green | `fix(messages): reject messages to self`, `test(messages): cover role rules (MSG-01, MSG-02)`, `test(messages): cover contact info and length (MSG-03, MSG-04)`, `test(messages): cover thread privacy (MSG-07, MSG-10)` |
**Exit:** POST/POLL/MSG suites green.

## Phase C: Moderation and spam (about 2.5 h)
| ID | Task | Acceptance | Expected commits |
| --- | --- | --- | --- |
| D2-07 | Normalization upgrade: strip zero-width/look-alike chars, collapse repeats, "at/dot" email spellings, spaced digits, social-handle patterns; Scunthorpe-safe word matching | MOD-01..03 pass with new cases | `refactor(moderation): split into normalize and detectors`, `feat(moderation): strip zero-width and look-alike characters`, `feat(moderation): detect spelled-out emails and spaced numbers`, `test(moderation): add leetspeak and spacing cases (MOD-01)`, `test(moderation): add innocent-word cases (MOD-02)`, `test(moderation): add contact detector cases (MOD-03)` |
| D2-08 | Spam heuristics: repetition, ALL CAPS, link count; configurable in `server/config.js` | unit tests | `feat(moderation): add repetition and caps heuristics`, `feat(moderation): reject links in v1`, `test(moderation): cover spam heuristics` |
| D2-09 | LLM layer hardening: strict zod-validated JSON output, reason codes, timeouts, injection-resistant prompt, never sends usernames; tests with mocked fetch (MOD-04, MOD-05) | fails open safely | `refactor(moderation): isolate llm client`, `feat(moderation): validate llm output with zod`, `test(moderation): cover provider failures (MOD-04)`, `test(moderation): cover injection strings (MOD-05)` |
| D2-10 | Auto-mute rule: 5 moderation rejections in 1 hour mutes for 1 hour and creates a system report; test MOD-06 | green | `feat(moderation): add rejection counter`, `feat(moderation): auto-mute repeat offenders`, `test(moderation): cover auto-mute (MOD-06)` |
**Exit:** MOD suite green; blocklist notes in docs.

## Phase D: Rate limits and HTTP hardening (about 2 h)
| ID | Task | Acceptance | Expected commits |
| --- | --- | --- | --- |
| D2-11 | Upstash rate limiter wrapper `server/rateLimit.js` (verify package docs); global IP + login (IP and username); fallback to in-memory when Redis errors; headers `Retry-After`/`RateLimit-*` | RATE-01..04 pass (Redis mocked in tests) | `build(deps): add upstash ratelimit and redis`, `feat(limits): add redis rate limiter wrapper`, `feat(limits): apply global and login limits`, `feat(limits): add safe in-memory fallback`, `test(limits): cover limiter and fallback (RATE-01..04)` |
| D2-12 | Unify per-user caps into `server/limits.js` (reads config; returns remaining and retry seconds); add replies/reactions limits to config now (used on Day 3) | POST-04, POLL-03, MSG-05 still green | `refactor(limits): add per-user cap helper`, `refactor(posts): use cap helper`, `refactor(polls): use cap helper`, `refactor(messages): use cap helper`, `docs(limits): sync limits table` |
| D2-13 | Security headers and CSP per `SECURITY.md` section 6 (verify app works with the production build served locally), HSTS, referrer policy, permissions policy; 413/415 tests; maintenance mode (`MAINTENANCE_MODE=1` blocks writes with 503) | SEC-01, SEC-02, SEC-09, SEC-10 pass | `security(api): add content security policy`, `security(api): add hsts and referrer policy`, `feat(api): add maintenance mode`, `test(api): cover headers and payload limits (SEC-01, SEC-02, SEC-09)`, `test(api): cover maintenance mode (SEC-10)` |
| D2-14 | RLS proof test (anon client cannot access any table, SEC-05), gitleaks in CI, `.well-known/security.txt` placeholder | green CI | `test(db): prove anon key has no table access (SEC-05)`, `ci(ci): add secret scanning`, `docs(security): add security.txt placeholder` |
| D2-15 | Docs: update API.md (429/Retry-After, close poll), CONTEXT.md, SECURITY.md checkboxes, PROGRESS.md | accurate | `docs(api): document limits and new endpoints`, `docs(progress): record day 2` |
**Stretch:** ADM-01..06 admin tests (else Day 3 phase D).

## Day 2 exit checklist
- [ ] ISO, POST, POLL, MSG, MOD, RATE, SEC-01/02/05/09/10 green; coverage on auth/authz/voting/moderation near 100%
- [ ] CSP active and the production build works
- [ ] Redis outage does not take the API down (tested)
- [ ] 4 PRs merged without squash; 30+ meaningful commits
- [ ] PROGRESS.md updated; first task for Day 3 = D3-01
