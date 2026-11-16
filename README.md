# S.T.I.P.S

**Student-Teacher Interaction & Polling System** (prototype)

A private space for one college campus: a community feed for notices and memes, polls everyone can vote in, and direct messages between students and teachers that never expose personal contact details.

> One campus. Every voice, counted.

## What is in the box

| Area | What it does |
| --- | --- |
| Landing page | Explains the goal, then leads to sign-in |
| Sign-in | Username + password issued by the office. First sign-in forces a new password |
| Communities | Created by the platform operator; the office (admin) then adds teachers and students, or shares a community code |
| Community feed | Posts up to 280 characters, in four categories: Notice, Event, Meme, Moment |
| Polls & votes | 2 to 6 options, 1 to 7 days, one vote per person, results visible after you vote |
| Messages | One-to-one, username only. Students can message teachers and the office. Phone numbers and emails are blocked |
| Profile | Display name, 160-character bio, change password |
| Create | One place to make a post, a poll, and (for admins) accounts and reports |
| Safety | Word filter, optional AI screening, reporting, rate limits, mute / suspend, minimal data |

## Documents

Engineering & Build Kit:
- [GEMINI.md](GEMINI.md) agent directives and rules
- [docs/PROGRESS.md](docs/PROGRESS.md) living progress and handoff log
- [docs/PRODUCT.md](docs/PRODUCT.md) product boundaries and user persona
- [docs/CONTEXT.md](docs/CONTEXT.md) codebase ground truth and stack details
- [docs/DECISIONS.md](docs/DECISIONS.md) architectural decision records (ADRs)
- [docs/DATABASE.md](docs/DATABASE.md) schema, migrations, RLS, indexes
- [docs/TESTING.md](docs/TESTING.md) test strategy and test cases catalog
- [docs/GIT_CONVENTIONS.md](docs/GIT_CONVENTIONS.md) micro-commit protocol and workflow
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) 4-day roadmap and phases
- [plans/DAY-1-PLAN.md](plans/DAY-1-PLAN.md) Day 1 task plan

General (anyone):
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) for students and teachers
- [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) for the principal or office
- [docs/ROADMAP.md](docs/ROADMAP.md) what is not built yet

Technical (developers):
- [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) run it on your laptop
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) how the pieces fit
- [docs/API.md](docs/API.md) every endpoint
- [docs/SECURITY.md](docs/SECURITY.md) rate limits, spam, privacy, cookies, and what is still open
- [docs/DEPLOY.md](docs/DEPLOY.md) Supabase + Vercel step by step

## Folder map

```
stips/
├─ api/index.js          Vercel entry: one serverless function hosting Express
├─ server/               Express API
│  ├─ app.js             middleware order, routes, rate limits
│  ├─ config.js          every limit in one place
│  ├─ session.js         cookie + role guards
│  ├─ moderation.js      word filter, contact-info block, optional AI check
│  └─ routes/            auth, posts, polls, messages, reports, admin
├─ src/                  React front end (Vite)
│  ├─ pages/             Landing, Auth, Feed, Polls, Messages, Profile, Create, Legal
│  └─ components/        Shell (sidebar), CookieNotice
├─ supabase/schema.sql   database tables + row level security
├─ scripts/create-admin.js  bootstrap a community and its first admin
├─ .env.example          the secrets you must set
└─ vercel.json           routing
```

## Quick start

```bash
npm install
cp .env.example .env        # fill in Supabase + JWT_SECRET
# run supabase/schema.sql in the Supabase SQL editor
npm run create-admin -- "My College" "Principal Name"
npm run dev:api             # terminal 1  (API on :3001)
npm run dev                 # terminal 2  (site on :5173)
```

Full details in [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md).

## Stack, and why

- **React + Vite**: simple, fast, easy to hand over.
- **Express inside one Vercel function**: you asked for Express; one function also stays inside Vercel's free-plan function limit.
- **Supabase (Postgres)**: real relational data, unique constraints for one-vote-per-person, and row level security as a safety net.
- **OpenAI-compatible chatbot API (Groq / OpenRouter / NVIDIA)**: used only for optional content screening. Not required.
- **Python**: not needed for this app, so it is not used. It would fit later for analytics or a moderation service.

## Status

Prototype. The code is written to be a real foundation (see SECURITY.md), but it has not been through a security audit or load test. Read [docs/ROADMAP.md](docs/ROADMAP.md) before putting real students on it.
