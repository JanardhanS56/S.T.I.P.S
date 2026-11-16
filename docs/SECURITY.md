# Security Plan

Standards followed: **OWASP Top 10 (2021)** and **OWASP ASVS Level 1** as the working checklist, plus the CIS-style basics for secrets and dependencies. This is a checklist for engineering, **not a certification**. A human review is required before real students use the system.

## 1. Assets and threats

| Asset                 | Threats                                                          |
| --------------------- | ---------------------------------------------------------------- |
| Accounts and sessions | credential stuffing, brute force, cookie theft, session fixation |
| Messages and posts    | cross-community leaks, IDOR, scraping, stored XSS                |
| Service role key      | leak through repo, logs, client bundle                           |
| Polls                 | double voting, vote tampering, ballot probing before voting      |
| Availability          | spam floods, expensive queries, free-tier exhaustion             |
| Users (minors)        | harassment, grooming attempts, contact-detail sharing            |

Trust boundaries: browser (untrusted) | Express API (trusted) | Supabase (trusted, deny-all RLS) | LLM provider (external; receives text only).

## 2. OWASP Top 10 mapping

| Risk                       | Control in S.T.I.P.S                                                                       | Test                                 |
| -------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| A01 Broken access control  | server-side role checks, community scoping from session, IDs validated                     | isolation tests across community A/B |
| A02 Cryptographic failures | bcrypt, HTTPS only, Secure cookies, no secrets in client                                   | cookie flag test; secret scan        |
| A03 Injection              | supabase-js parameterization, zod validation, React escaping, no `dangerouslySetInnerHTML` | XSS payload tests                    |
| A04 Insecure design        | closed communities, DM rule, limits, threat model                                          | review                               |
| A05 Misconfiguration       | helmet + CSP, no stack traces, env validation at boot                                      | header test                          |
| A06 Vulnerable components  | `npm audit`, Dependabot, lockfile                                                          | CI audit                             |
| A07 Auth failures          | lockout, rate limit, forced password change, session revoke                                | auth tests                           |
| A08 Integrity failures     | CI checks, protected main, lockfile, no unknown scripts                                    | CI                                   |
| A09 Logging failures       | structured logs with request id, audit log, no secrets/PII in logs                         | log tests                            |
| A10 SSRF                   | the only outbound call is the configured LLM URL (env, not user input)                     | review                               |

## 3. Authentication and sessions (requirements)

- Passwords: bcrypt (cost 10 or higher; verify current guidance), min 10 characters, block the 100 most common passwords and passwords equal to the username.
- One-time passwords random 12 chars; force change on first sign-in; invalidate on reset.
- Lockout after 5 failures for 10 minutes (DB) plus IP limiter (Redis).
- Cookie: HttpOnly, Secure, SameSite=Strict, 7 days max, rotate on password change.
- **Sign out everywhere**: JWT carries `tv` (token_version); `requireAuth` rejects when it differs from `users.token_version`. Bump on password change, reset, suspension.
- Constant-ish login timing and identical errors for unknown user vs wrong password (already in baseline).

## 4. Authorization rules (must be tested)

- Every route declares its allowed roles. Default deny.
- Object access: load by id **and** community; 404 (not 403) when it belongs to another community.
- Admins cannot act on other communities or on other admins.
- Muted users cannot create content; suspended cannot sign in.
- Poll results hidden until voted or closed (admins exempt). Voter identity never returned.

## 5. Input and output

- Validate every body, query and param with zod; reject unknown shapes; cap array and string sizes.
- Output encoding by React; never render user text as HTML. Links in user text are plain text unless allowlisted (v1: none).
- JSON body 10 kb; JSON-only writes; reject other content types.

## 6. HTTP hardening

- helmet defaults plus a **Content-Security-Policy** tailored to the app: `default-src 'self'`; `style-src 'self' https://fonts.googleapis.com`; `font-src https://fonts.gstatic.com`; `script-src 'self'`; `img-src 'self' data:`; `connect-src 'self'`; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`. Verify the Vite production build works under it.
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` minimal.
- No CORS (same-origin). If ever needed, explicit allowlist.
- Generic 404/500 bodies; never reveal stack traces or table names.

## 7. Secrets and config

- `.env` git-ignored; `.env.example` has names only. Boot fails fast if required env is missing (validate with zod at startup).
- Different keys per environment; rotate if exposed. Use a secret scanner in CI (e.g. gitleaks; verify action name in its docs) and a pre-commit check.
- The service role key never appears in client code, logs, error messages or screenshots.

## 8. Logging and monitoring

- Structured JSON logs (level, time, request id, user id, community id, route, status, ms). **Never** log passwords, cookies, message bodies, full tokens, or personal data.
- Error tracking (Sentry or equivalent; verify free tier and its privacy settings; scrub bodies).
- Audit log (DB) for admin actions: create members, reset password, mute, suspend, hide content, resolve report, export, delete.
- Alerts: 5xx rate, login failure spikes, Upstash/Supabase quota warnings.

## 9. Moderation safety

See `RATE_LIMITING_AND_ABUSE.md`. Child-safety: no image uploads, no contact-detail sharing, student-student DMs off, easy reporting, fast admin action, a documented escalation path to the institute's designated safeguarding person `[NEEDS HUMAN REVIEW]`.

## 10. Dependency and supply-chain hygiene

`npm ci` in CI; `npm audit --audit-level=high` as a CI gate; Dependabot weekly; pin Node version; review any new dependency (maintenance, size, install scripts).

## 11. Pre-launch security checklist

- [ ] Anon key cannot read or write any table (test passes)
- [ ] Cross-community access attempts return 404 for every object route (tests pass)
- [ ] CSP active and app works; headers verified
- [ ] Cookie flags verified in production
- [ ] No secrets in git history (scanner run on full history)
- [ ] Rate limits verified against a deployed preview
- [ ] Stored XSS payloads render as text
- [ ] Error tracking active and scrubbing bodies
- [ ] Backups restored once successfully
- [ ] Admin actions appear in the audit log
- [ ] `npm audit` clean at high/critical
- [ ] Independent human review done `[NEEDS HUMAN REVIEW]`

## 12. Vulnerability reporting

Publish `SECURITY.md` at the repo root (use `templates/.github` guidance) with a contact `[OFFICE/OWNER CONTACT]` and a response promise `[TARGET]`.
