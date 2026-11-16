# Decision Log (ADR-lite)

Format: ID | Decision | Why | Revisit when. **Do not re-open these without the owner.**

| ID  | Decision                                                                            | Why                                                              | Revisit                                                          |
| --- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| D1  | Browser never talks to Supabase; Express is the only data path                      | One place for auth and rules; RLS stays deny-all as a safety net | If realtime is needed                                            |
| D2  | One Express app in one Vercel function                                              | Free-plan function cap; simple                                   | If cold starts hurt                                              |
| D3  | JavaScript (ESM), no TypeScript for v1                                              | Speed over 4 days; JSDoc where helpful                           | After v1.0                                                       |
| D4  | Cookie session (JWT in HttpOnly cookie), SameSite=Strict                            | No token in JS; CSRF-resistant with JSON-only writes             | If a mobile app appears                                          |
| D5  | Accounts issued by admin; no public signup                                          | Closed community, school accountability                          | Never for v1                                                     |
| D6  | No email or phone anywhere                                                          | Privacy promise; fewer data duties                               | If password reset by email is demanded                           |
| D7  | DMs: teacher-student only (students cannot DM students)                             | Safer default; admin setting later                               | Roadmap                                                          |
| D8  | Polling every 8s for messages, no websockets                                        | Serverless-friendly                                              | Supabase Realtime later                                          |
| D9  | Rate limits: DB-counted per-user caps + Upstash Redis for per-IP                    | Exactness where it matters, durability for IP limits             | If Upstash limits bite                                           |
| D10 | Tests: Vitest + Supertest (API), Playwright (E2E), axe (a11y)                       | Standard, fast, free                                             |                                                                  |
| D11 | Migrations via Supabase CLI SQL files in `supabase/migrations/`                     | Reproducible DB                                                  |                                                                  |
| D12 | Merge with merge commit or rebase, not squash                                       | Preserve micro-commit history                                    |                                                                  |
| D13 | AI moderation is optional and fails open, with word filter and reports as the floor | Keeps app available; AI is not a guarantee                       | If abuse appears                                                 |
| D14 | Plain CSS with design tokens; no CSS framework                                      | Control of look; small bundle                                    |                                                                  |
| D15 | Analytics policy: none                                                              | Privacy and cookie simplicity                                    | If metrics are needed (then server-side, cookieless, documented) |
