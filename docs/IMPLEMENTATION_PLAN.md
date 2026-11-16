# Implementation Plan: 4 Days to v0.1.0

Four days. Four master prompts. Each day has **four phases (A, B, C, D)**, each phase is one branch and one PR. The agent executes one phase, stops for a checkpoint, then continues.

## Overview
| Day | Theme | Phases | Exit state |
| --- | --- | --- | --- |
| 1 | Foundations: tooling, DB migrations, test harness, auth hardening, logging, CI | A Repo and tooling, B Config and database, C Tests and auth, D Logging and CI | Reproducible repo with CI green, migrations, auth tests, structured logs |
| 2 | Backend hardening: isolation, content rules, moderation, rate limiting, HTTP security | A Authorization and isolation, B Posts/polls/messages rules, C Moderation and spam, D Rate limits and headers | Backend proven by tests; limits durable; security headers on |
| 3 | Product features and UX: design system, replies, reactions, blocks, unread, admin dashboard, E2E | A UI foundation, B Social features, C Messaging and polls, D Admin and E2E | Feature-complete app with a consistent accessible UI |
| 4 | Compliance, quality, operations, release | A Legal and user rights, B Accessibility and performance, C Observability and deploy, D Security sign-off and release | Production deployment and tag `v0.1.0` |

## Owner prerequisites (do before Day 1)
- GitHub repo created, default branch `main`, git `user.email` set to your GitHub-linked email.
- Supabase: **3 projects** (dev, staging, production) or at least dev + staging (production by Day 4). Keep URLs and service keys private.
- Vercel account linked to the repo.
- Upstash account with one Redis database (free tier; verify limits) before Day 2 phase D.
- (Optional) Groq / OpenRouter / NVIDIA API key for moderation.
- (Optional) Sentry project before Day 4 phase C.
- Antigravity set up with `GEMINI.md` as workspace rules; Planning mode on (verify the setting name in the app).
- Decide: who is the data fiduciary, grievance contact, retention periods (see `COMPLIANCE.md`, `DATABASE.md`). Placeholders are fine until Day 4.

## Rules of engagement
1. Do the phases in order; do not start a phase until the previous PR is merged and CI is green.
2. Each task has an ID. Tasks list the commits you should expect. The agent may split commits further but never merge them into a big one.
3. **Must** tasks ship; **Stretch** tasks only if time remains, otherwise move to `PROGRESS.md` > Parked ideas.
4. If a day slips, cut Stretch first, then reduce scope inside a task, never cut tests, security or accessibility.
5. End every phase with: checks green, PR opened, `docs/PROGRESS.md` updated.

## Time budget (guide, 8 to 10 hours of focused work per day)
Phase A about 2 h | B about 2.5 h | C about 2.5 h | D about 2 h | buffer 1 h.

## Risk register
| Risk | Mitigation |
| --- | --- |
| Agent drifts or hallucinates APIs | `GEMINI.md`, verification protocol, recovery prompts |
| Free-tier limits (Vercel, Supabase, Upstash, LLM) | check quotas Day 2 and Day 4; fallbacks in code |
| Legal unknowns about minors | flag `[NEEDS HUMAN REVIEW]`; do not launch to minors until resolved |
| Test DB pollution | separate test project; guard against production URL |
| Day 3 too big | Must/Stretch split; Stretch moves to ROADMAP |
| CSP breaks the app | verify in a production build locally and on preview |
| Solo burnout | stop at phase boundaries; keep PROGRESS.md honest |

## Definition of done for v0.1.0
Everything in `LAUNCH_CHECKLIST.md` is checked or listed as an accepted, documented risk.
