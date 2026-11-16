# Testing Strategy and Test Cases

## 1. Goals

Prove, automatically, that: roles and community isolation hold, one-vote rules hold, limits work, moderation blocks what it should, nothing leaks, pages are accessible, and the main user journeys work end to end.

## 2. Tools (decision D10; verify current versions/docs when installing)

| Layer                                                                                                               | Tool                                                                       | Notes                                                                                    |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Unit                                                                                                                | **Vitest**                                                                 | pure functions: moderation, slug, validators, config                                     |
| API integration                                                                                                     | **Vitest + Supertest**                                                     | runs the Express `app` in-process against a **test Supabase project** (never production) |
| Component                                                                                                           | Vitest + Testing Library (optional, Day 3)                                 | forms and polls UI logic                                                                 |
| End to end                                                                                                          | **Playwright**                                                             | Chromium + a mobile viewport; runs against local dev or preview                          |
| Accessibility                                                                                                       | **@axe-core/playwright**                                                   | every page, plus manual keyboard pass                                                    |
| Security                                                                                                            | custom tests + `npm audit` + gitleaks + OWASP ZAP baseline scan (optional) |                                                                                          |
| Load                                                                                                                | **k6** or **autocannon**                                                   | light smoke load on a preview                                                            |
| Scripts to add: `test`, `test:watch`, `test:api`, `test:e2e`, `test:a11y`, `test:coverage`, `lint`, `format:check`. |

## 3. Layout

```
tests/
  helpers/          app factory, login helper (returns cookie), seed/reset, factories
  unit/             moderation.test.js, config.test.js, slug.test.js ...
  api/              auth.test.js, isolation.test.js, posts.test.js, polls.test.js,
                    messages.test.js, reports.test.js, admin.test.js, limits.test.js,
                    headers.test.js, rls.test.js
e2e/                landing.spec.js, signin.spec.js, feed.spec.js, polls.spec.js,
                    messages.spec.js, admin.spec.js, a11y.spec.js
```

## 4. Environments and data

- `.env.test` points at a **separate Supabase project** (test/staging). Tests refuse to run if `SUPABASE_URL` equals the production URL (guard in `tests/helpers`).
- `seed` creates communities **A** and **B** with an admin, 2 teachers, 4 students each. Tests reset known tables before the suite and use unique usernames per test where needed.
- Time-dependent tests (poll close, lockout) use fake timers or small configurable windows.
- Never put real passwords or keys in tests; use generated test accounts.

## 5. Coverage targets (proposed; owner may change)

Server: 80% lines overall, **100% of auth, authorization, voting and moderation decision paths**. Frontend: critical flows by E2E rather than a line target.

## 6. Test case catalog

IDs are referenced by the day plans and in commit messages (`test(auth): add AUTH-03`).

### Authentication (AUTH)

- AUTH-01 login with correct credentials sets an HttpOnly cookie and returns the public user (no hash).
- AUTH-02 wrong password and unknown user return the same 401 message.
- AUTH-03 5 wrong passwords lock the account for 10 min (429), correct password still rejected while locked.
- AUTH-04 lock expires; counter resets after success.
- AUTH-05 suspended user cannot sign in (403) and existing sessions stop working.
- AUTH-06 `me` without cookie returns 401; with tampered cookie returns 401.
- AUTH-07 first login returns `mustChangePassword: true`; change-password requires the current password and 10+ chars.
- AUTH-08 password equal to username or in the common list is rejected.
- AUTH-09 token_version bump (reset, change, sign-out-everywhere) invalidates old cookies.
- AUTH-10 cookie flags: HttpOnly; SameSite=Strict; Secure in production mode.
- AUTH-11 join by code only works for users without a community; wrong code 404; already joined 409.
- AUTH-12 logout clears the cookie.

### Authorization and isolation (ISO)

- ISO-01 student calling any `/api/admin/*` gets 403.
- ISO-02 teacher calling `/api/admin/*` gets 403.
- ISO-03 community A user cannot read community B posts, polls, threads (lists contain none of B's ids).
- ISO-04 A user requesting a B object by id (post, poll, report, user) gets 404, not 403.
- ISO-05 A user cannot vote in, delete, report or message into community B.
- ISO-06 `community_id` or `author_id` sent in a request body is ignored.
- ISO-07 admin of A cannot change status or reset password of a B user, or of another admin.
- ISO-08 user without a community gets 403 on community routes.
- ISO-09 muted user can read but cannot post, poll, vote, message, reply, react.

### Posts and replies (POST)

- POST-01 create with valid body and category returns 201; appears in feed.
- POST-02 281 characters rejected (400); empty and whitespace-only rejected.
- POST-03 invalid category rejected.
- POST-04 11th post in an hour returns 429 with `Retry-After`.
- POST-05 duplicate text within 10 minutes rejected.
- POST-06 blocked word rejected with a gentle message (422); contact info rejected.
- POST-07 only the author or admin can delete; deleted post disappears from the feed.
- POST-08 XSS payloads (`<script>`, `<img onerror>`) are stored as text and returned unchanged; UI renders as text (E2E).
- POST-09 pagination returns at most the limit and a stable cursor.
- POST-10 reply to a post in the same community works; reply to another community's post 404; reply depth limited to 1 level.
- POST-11 official/pinned flag can only be set by admin.
- POST-12 reactions: one per user per post; toggling removes; invalid kind rejected.

### Polls (POLL)

- POLL-01 create with 2 to 6 options, 1 to 7 days.
- POLL-02 1 option, 7 options, 0 days, 8 days rejected.
- POLL-03 6th poll in 24h returns 429.
- POLL-04 vote succeeds once; second vote 409; concurrent double-submit yields exactly one vote (parallel requests).
- POLL-05 vote on closed poll 409; on foreign poll 404; with an option from another poll 400.
- POLL-06 results hidden (null counts) before voting; visible after voting and after close; admin sees them.
- POLL-07 voter identities are never present in any response.
- POLL-08 hidden poll not listed and not votable.
- POLL-09 percentages sum within rounding; zero-vote poll shows 0 without dividing by zero.

### Messages (MSG)

- MSG-01 teacher to student and student to teacher succeed.
- MSG-02 student to student rejected (403).
- MSG-03 phone number and email in body rejected (including spaced digits "9 8 7 6...").
- MSG-04 501 characters rejected.
- MSG-05 61st message in an hour returns 429.
- MSG-06 cannot message a suspended user, a user in another community, or yourself.
- MSG-07 thread endpoint returns only the two participants' messages, ordered ascending.
- MSG-08 blocked user cannot message the blocker; blocker can unblock.
- MSG-09 unread counts update when the recipient opens the thread.
- MSG-10 a third user can never read someone else's thread by guessing ids.

### Reports and admin (ADM)

- ADM-01 any member can report; limit 20/day.
- ADM-02 admin sees open reports for own community only.
- ADM-03 resolve with hide hides the post and marks the report actioned; dismiss marks dismissed.
- ADM-04 bulk member creation returns unique usernames and one-time passwords; passwords stored hashed; max 200.
- ADM-05 reset password returns a new one-time password, forces change, bumps token version.
- ADM-06 mute/suspend/activate works and takes effect immediately.
- ADM-07 every admin action creates an audit log row with actor, action, target.
- ADM-08 export-my-data returns only the requester's data; deletion request flow anonymizes content.

### Rate limiting (RATE)

- RATE-01 global limiter returns 429 after the threshold with `Retry-After`.
- RATE-02 login limiter per IP and per username.
- RATE-03 limiter falls back safely when Redis is unavailable (simulate) and logs a warning.
- RATE-04 limits are read from `server/config.js` (change config in test, behavior changes).

### Moderation (MOD)

- MOD-01 word filter blocks plain, leetspeak (`1d10t`), spaced and mixed-case variants.
- MOD-02 word filter does not block innocent words that contain blocked substrings (Scunthorpe cases) per the rules.
- MOD-03 contact-info detector: +91 and plain 10-digit numbers, spaced digits, emails, "at/dot" spellings, social handles.
- MOD-04 LLM layer: timeout, malformed JSON, provider 500 all fall back to allow without crashing.
- MOD-05 prompt-injection strings do not change the decision shape.
- MOD-06 repeated rejections trigger the auto-mute rule.

### Security and platform (SEC)

- SEC-01 security headers present (CSP, HSTS in prod, nosniff, frame-ancestors none, referrer policy).
- SEC-02 non-JSON write returns 415; body over 10 kb returns 413.
- SEC-03 error responses never include stack traces or SQL text.
- SEC-04 SQL-injection-style strings in params and bodies are handled as plain data (no 500).
- SEC-05 anon Supabase key cannot select/insert/update/delete any table (RLS test using the anon client).
- SEC-06 `.env`, `node_modules`, source maps with secrets are not served by the deployed site.
- SEC-07 secret scan passes on the working tree and history.
- SEC-08 `npm audit --audit-level=high` passes.
- SEC-09 oversized and deeply nested JSON rejected quickly.
- SEC-10 maintenance mode returns 503 for writes and 200 for reads.

### Accessibility (A11Y)

- A11Y-01 axe finds 0 serious/critical violations on every public and app page, mobile and desktop.
- A11Y-02 full keyboard flow: sign in, post, vote, send a message, with visible focus.
- A11Y-03 modals trap focus and close with Esc; focus returns to the trigger.
- A11Y-04 form errors are announced (`role="alert"`) and linked to fields.
- A11Y-05 zoom 200% and a 320px-wide viewport cause no horizontal scroll or clipped content.
- A11Y-06 `prefers-reduced-motion` respected.

### End to end (E2E)

- E2E-01 landing to sign in to forced password change to feed.
- E2E-02 admin creates members, a student signs in with the issued credentials.
- E2E-03 student posts, teacher replies and reacts; admin pins.
- E2E-04 teacher creates a poll; two students vote; results correct; a second vote attempt is refused.
- E2E-05 student messages teacher; unread badge appears; teacher replies.
- E2E-06 student reports a post; admin hides it; it disappears from the feed.
- E2E-07 rate limit message appears gracefully after repeated posting.
- E2E-08 cookie notice shows once; legal pages reachable from footer.
- E2E-09 mobile viewport navigation works.
- E2E-10 session revoke: "sign out everywhere" logs out another browser context.

### Performance and resilience (PERF)

- PERF-01 feed, polls and thread queries under 200 ms server time with seeded realistic data `[TARGET: owner confirms]`.
- PERF-02 k6/autocannon smoke: 50 concurrent users for 60 seconds, error rate under 1% `[TARGET]`.
- PERF-03 Supabase down: API returns 503 friendly error; no crash loop.
- PERF-04 front-end bundle size budget `[TARGET: e.g. under 250 kB gzip JS]`.

## 7. Manual QA checklist (before release)

Sign in on a real phone; try slow 3G in dev tools; try with a screen reader quickly; try in Firefox and Safari; try a tablet width; test with JavaScript errors in console (none allowed); test back/forward and refresh on every route; test expired session behavior; test two tabs voting simultaneously.

## 8. CI gate (see `templates/.github/workflows/ci.yml`)

lint, format check, unit + API tests, build, `npm audit`, secret scan. E2E and axe run on pull requests against a preview or local server. **No merge to main on red.**

## 9. Rules for the agent about tests

Write the test with the feature (or just before). A bug fix starts with a failing test. Never delete or `.skip` a test to get green; if a test is wrong, explain why and fix it in a separate `test:` commit.
