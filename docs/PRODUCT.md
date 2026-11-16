# Product Definition

## One line

A private, closed space for a single college campus where students and teachers post short updates, vote in polls, and message each other without sharing personal contact details.

## Problem

Campus communication is scattered: WhatsApp groups mix notices with noise, notice boards are slow, polls are informal, and students hesitate to message teachers on personal numbers. There is no single, safe, school-controlled place with clear roles.

## Users

| Persona                  | Needs                                                             | Pain today                                              |
| ------------------------ | ----------------------------------------------------------------- | ------------------------------------------------------- |
| Student                  | Know what is happening, have a say, ask teachers questions safely | Missed notices, no voice, awkward personal-number chats |
| Teacher                  | Reach students, run quick polls, answer questions on-platform     | Group chat clutter, privacy worries                     |
| Admin (principal/office) | Control who is in, keep it clean, see problems                    | No moderation tools, no accountability                  |

## Core value

1. Closed and accountable: accounts are issued by the office; everyone is known by username and name.
2. Short and useful: 280-character posts, categorized (Notice, Event, Meme, Moment).
3. Decide together: polls with one vote per person.
4. Safe talk: teacher-student messages without phone numbers or emails.
5. Clean by design: moderation, reporting, rate limits.

## v1.0 scope (what must exist)

Landing, sign-in with forced first-time password change, community join, feed (post, categories, delete own, report), polls (create, vote, results, close), messages (teacher-student), profile, admin tools (create accounts, reports queue, mute/suspend, reset password), legal pages, cookie notice, error pages.

## Added in the 4-day plan (to be a real product)

Replies on posts, reactions, official/pinned notices from admin, block user in messages, in-app unread indicators, admin dashboard UI (members list, status controls), audit log, account data export and deletion request, session revoke ("sign out everywhere"), durable rate limiting, test suite, CI, observability, backups, runbook.

## Non-goals for v1.0

Public signup, email or SMS, file or image uploads, video, third-party login, native mobile apps, cross-campus social graph, ads, analytics trackers, AI chatbots for end users, payments, real-time websockets (polling is fine).

## Success measures (define targets with the owner; do not invent numbers)

- A new admin can onboard a campus in under 30 minutes. `[TARGET: owner to set]`
- Zero known cross-community data leaks (verified by tests).
- Moderation response: reported content reviewed within `[TARGET]`.
- Accessibility: automated axe checks pass on all pages; manual keyboard walkthrough passes.

## Constraints

Free-tier friendly (Vercel Hobby, Supabase free). Single developer. Prototype name S.T.I.P.S, no logo yet. Black and white plus green. Must not look AI-generated.

## Risks

Minors and consent law, moderation load on the office, data in plain text messages, free-tier limits and cold starts, a solo maintainer. See `SECURITY.md`, `COMPLIANCE.md`, `ROADMAP.md`.
