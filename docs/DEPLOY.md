# Deploying to Vercel + Supabase

1. **Supabase**: create a project, run `supabase/schema.sql`, copy the URL and service role key.
2. **Git**: push this folder to a GitHub repository (`.env` is git-ignored; keep it that way).
3. **Vercel**: Add New > Project > import the repo. Framework preset: Vite. Build command `npm run build`, output `dist`. Vercel detects `api/index.js` and `vercel.json` automatically.
4. **Environment variables** (Project > Settings > Environment Variables): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, and optionally `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`. Mark the key values as sensitive.
5. **Deploy**, then open `https://YOUR-APP.vercel.app/api/health`. It should return `{"ok":true}`.
6. **Create the first admin** from your own computer (the script talks to Supabase directly):
   ```bash
   npm run create-admin -- "Your Institute" "Principal Name"
   ```
7. Sign in on the live site with the printed username and password.

## Choosing an AI provider for screening

Any OpenAI-compatible endpoint works:

- Groq: `LLM_BASE_URL=https://api.groq.com/openai/v1`
- OpenRouter: `https://openrouter.ai/api/v1`
- NVIDIA: `https://integrate.api.nvidia.com/v1`
  Set `LLM_MODEL` to a small, fast model from that provider. Check the provider's current model names and free-tier limits yourself.

## Before real users

Work through "Known gaps" in SECURITY.md and "Before launch" in ROADMAP.md.
