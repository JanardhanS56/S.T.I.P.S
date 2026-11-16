# Security, safety and privacy

This lists what is built, how it works, and what is still open. Read the last section before launch.

## Rate limiting and spam control
| Layer | Where | Detail |
| --- | --- | --- |
| Request size | `express.json({limit:'10kb'})` | blocks oversized payloads |
| Per-IP throttle | `server/app.js` | 300 requests / 15 min on `/api` |
| Login throttle | `routes/auth.js` | 20 attempts / 15 min per IP |
| Account lockout | `routes/auth.js` + `users.locked_until` | 5 wrong passwords lock the account 10 min (stored in the database, so it works across servers) |
| Posts | `routes/posts.js` | 10 per user per hour (counted in the database) |
| Polls | `routes/polls.js` | 5 per user per day |
| Messages | `routes/messages.js` | 60 per user per hour |
| Reports | `routes/reports.js` | 20 per user per day |
| Votes | database primary key | exactly one per user per poll |
All numbers live in `server/config.js`.

## Family-friendly environment
1. **Closed community.** No public signup; accounts are issued by the office; everything is scoped to one community.
2. **Word filter.** `server/blocklist.txt` plus basic leetspeak normalisation. The shipped list is a tiny starter; extend it.
3. **Contact-info block.** Phone numbers and emails are rejected in posts, messages and bios.
4. **Optional AI check.** If `LLM_API_KEY` is set, text goes to an OpenAI-compatible endpoint with a strict moderator prompt. Only the text is sent. If the provider is down the check is skipped (fail open) and layers 1-3 still apply.
5. **Reporting and admin tools.** Users report posts; admins hide content, mute or suspend accounts.
6. **Messaging rule.** Students cannot DM students by default.

## Authentication and sessions
- Passwords: bcrypt hashes. One-time passwords are random, shown once to the admin, and must be changed at first sign-in.
- Login errors are identical for unknown user and wrong password.
- Session cookie `stips_session`: HttpOnly, Secure (production), SameSite=Strict, 7 days.
- Writes require `application/json`, which a cross-site HTML form cannot send. Together with SameSite=Strict this covers CSRF for this design.
- `helmet` sets security headers.

## Privacy
- Collected: name, username, role, department, bio, content you create, community. Not collected: phone, email, address, photos, location.
- Browser never gets database access; RLS is on with no policies.
- Minors: [DECISION NEEDED] requirements differ by country and institute. Get consent handling confirmed before launch.
- Starter policy text is in `src/pages/Legal.jsx` and must be reviewed by someone qualified.

## Cookies
One essential cookie (session). No analytics or advertising cookies. The banner is informational. If you add analytics, replace it with a real opt-in.

## Known gaps (be honest with yourself)
- The per-IP throttle is in memory, so it counts per serverless instance. Per-user caps are exact (database). For a strict global IP limit, add Upstash Redis or a Vercel firewall rule.
- No automated tests yet. No external security review or load test.
- Admin can see only reported content in the UI, but the database holds all messages in plain text; protect Supabase access and decide a retention period.
- AI screening fails open; the word list is minimal.
- No password reset by email (by design: no emails). The office resets passwords.
- No audit log of admin actions yet.
