# Getting started (developers)

## Requirements

- Node.js 20 or newer
- A free Supabase project
- (Optional) A Groq, OpenRouter or NVIDIA API key for AI content screening

## 1. Install

```bash
npm install
```

## 2. Database

1. Create a project at supabase.com.
2. Open **SQL Editor > New query**, paste all of `supabase/schema.sql`, run it.
3. Open **Project Settings > API** and copy the project URL and the **service_role** key.

## 3. Environment

```bash
cp .env.example .env
```

Fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `JWT_SECRET`
(generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
Leave `LLM_API_KEY` empty to start; the word filter still works.

The service role key is a master key. It lives only in `.env` and in Vercel's environment settings. Never put it in `src/`, never commit `.env`.

## 4. Create the first community

```bash
npm run create-admin -- "Your Institute" "Principal Name"
```

It prints a community code, a username and a one-time password. Save them.

## 5. Run

```bash
npm run dev:api   # API on http://localhost:3001
npm run dev       # site on http://localhost:5173 (proxies /api to 3001)
```

Sign in as the admin, set a new password, open **Create > Admin tools**, add teachers and students, and hand them their usernames.

## Useful checks

- `http://localhost:3001/api/health` should return `{"ok":true}`.
- A wrong password five times locks that account for 10 minutes.
- Posting 11 times in an hour returns a friendly "take a short break" message.
