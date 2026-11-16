# Compliance, Privacy and Standard Pages

> **Not legal advice.** This is an engineering checklist. Items marked `[NEEDS HUMAN REVIEW]` must be confirmed by the institute's legal/management contact or a qualified lawyer before real users onboard. Laws change; verify current text.

## 1. Frameworks to design toward
| Area | Standard / law | What it means for S.T.I.P.S |
| --- | --- | --- |
| Data protection (India) | Digital Personal Data Protection Act, 2023 and its Rules (check current notification and commencement dates) | notice, purpose limitation, data minimization, security safeguards, grievance redressal, deletion on request, **verifiable parental/guardian consent for users under 18** and no tracking or targeted ads aimed at children `[NEEDS HUMAN REVIEW]` |
| Intermediary duties (India) | IT Act, 2000 and IT (Intermediary Guidelines) Rules `[NEEDS HUMAN REVIEW]` | published rules and terms, a grievance contact, a takedown process |
| Accessibility | WCAG 2.2 AA | built and tested (see `DESIGN.md`, `TESTING.md`) |
| Security | OWASP Top 10, ASVS L1 | see `SECURITY.md` |
| Cookies | Strictly necessary only | one session cookie; no consent banner legally needed for strictly necessary cookies in most regimes, but we inform users |
| If users outside India join | GDPR / UK GDPR etc. | out of scope for v1; flag if it happens |

## 2. Who is the "data fiduciary"?
Decide and write it down: the **institute** (most likely) with the platform operator as its processor, or the operator itself. This decides who signs the privacy policy, who the grievance officer is, and who handles deletion. `[OWNER + INSTITUTE TO DECIDE]`

## 3. Data inventory
| Data | Purpose | Legal basis / note | Retention |
| --- | --- | --- | --- |
| Name, username, role, department | identify members | required for service | account lifetime |
| Password hash | sign-in | security | account lifetime |
| Bio (optional) | profile | user-provided | until edited/deleted |
| Posts, replies, reactions, poll votes | core features | service | per `DATABASE.md` |
| Messages | core feature | service; admins see reported ones | per `DATABASE.md` |
| Reports, audit log | safety and accountability | legitimate safety interest | per `DATABASE.md` |
| Session cookie | stay signed in | strictly necessary | 7 days |
| IP in rate-limit store | abuse prevention | security | minutes to hours; hashed key |
| Server logs | operations | security | `[TARGET: e.g. 30 days]`, no message bodies |
Not collected: phone, email, address, photos, location, device fingerprint, advertising IDs.

## 4. Minors
- Many users may be under 18. Decide with the institute how guardian consent is collected and recorded (e.g. at admission by the institute, with a flag `consent_recorded` set by the admin). `[NEEDS HUMAN REVIEW]`
- No behavioral tracking, no profiling, no ads. Already true by design (D15).
- Messaging is teacher-student only; no external contact; no uploads.
- Add admin-visible `consent_recorded boolean` + `consent_recorded_at` (Day 4 stretch) so the institute can show it.

## 5. Standard pages (all required before launch)
| Page | Must contain |
| --- | --- |
| Privacy Policy `/privacy` | fiduciary identity, data inventory (above), purposes, retention, sharing (Supabase, Vercel, optional LLM provider as processors), security, children, rights (access, correction, erasure, grievance), how to request, contact, last updated date |
| Terms of Use `/terms` | eligibility (issued accounts), acceptable use, content ownership/licence, moderation rights, suspension, disclaimers, governing law/jurisdiction `[NEEDS HUMAN REVIEW]`, changes |
| Cookie Notice `/cookies` | list of cookies (table with name, purpose, duration, type), no tracking statement, how to clear |
| Community Guidelines `/guidelines` | allowed/not allowed, reporting, consequences, appeal |
| Accessibility Statement `/accessibility` | target WCAG 2.2 AA, known issues, how to report a barrier |
| Contact / Grievance `/contact` | office contact, grievance officer name and contact `[NEEDS HUMAN REVIEW]`, response time target |
| 404 and 500 pages | friendly, link home |
| `security.txt` at `/.well-known/security.txt` | contact for vulnerability reports |
| First-login consent screen | short plain-language notice + link to policy, "I understand" (records `accepted_terms_at`, `terms_version`) |
Footer on every public page links: Privacy, Terms, Cookies, Guidelines, Accessibility, Contact.

## 6. User rights features (build Day 4)
- **Export my data**: JSON of profile, posts, polls created, votes (own), messages (own). Rate limited (1 per day).
- **Delete my account**: creates a request; admin confirms; content anonymized to "Deleted user" and personal fields wiped; audit entry kept.
- **Correct my data**: profile edit already exists.
- Admins can also trigger export/delete for a member upon written request.

## 7. Third-party processors (document in privacy policy)
Vercel (hosting), Supabase (database), Upstash (rate-limit counters, if used), LLM provider (text screening, if enabled), Sentry (errors, if used). For each: purpose, data sent, region (check dashboards), link to their terms. Prefer regions close to users (e.g. India/Singapore where offered; verify). `[OWNER TO CONFIRM]`

## 8. Breach response (outline; detail in `OPERATIONS.md`)
Detect, contain (rotate keys, suspend affected paths), assess scope from logs and audit trail, notify the institute immediately, notify the regulator and affected people as required by law and timelines `[NEEDS HUMAN REVIEW]`, document, fix, post-mortem.

## 9. Open-source and licensing
Choose a LICENSE for your own code (MIT is common; or keep private). List third-party licenses (`npm ls` + a license checker) in `docs/THIRD_PARTY.md` on Day 4. Fonts (Schibsted Grotesk, IBM Plex Mono) are open fonts loaded from Google Fonts; **consider self-hosting them** to avoid third-party requests (privacy benefit).

## 10. Compliance Definition of Done
All pages above live and linked, consent screen working, export and deletion flows working, processor list accurate, retention jobs documented, `[NEEDS HUMAN REVIEW]` items either resolved or listed in `LAUNCH_CHECKLIST.md` as open risks.
