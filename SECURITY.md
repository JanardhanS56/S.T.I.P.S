# Security Policy

The S.T.I.P.S team takes security and student privacy seriously. We appreciate the responsible disclosure of vulnerabilities.

---

## 1. Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests, or public channels.**

To report a vulnerability, please email:

- **Security Contact:** `security@stips.campus.edu` `[NEEDS HUMAN REVIEW - replace with institutional security contact]`
- **Response Commitment:**
  - **Acknowledgment:** Within 48 hours of receipt.
  - **Initial Assessment & Severity Triage:** Within 5 business days.
  - **Resolution / Fix Deployment:** Target within 14–30 business days depending on severity.

When reporting, please include:

- A description of the vulnerability and potential impact.
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any affected endpoints, payloads, or user roles.
- Your preferred attribution name / handle for security acknowledgments.

---

## 2. Responsible Disclosure & Safe Harbor

We consider security research conducted under the following conditions to be authorized and in good faith:

- You make a good faith effort to avoid privacy violations, data loss, and disruption of service.
- You do not access, modify, or download student or faculty data belonging to accounts other than test accounts you own.
- You do not perform denial of service (DoS/DDoS) attacks, automated high-rate fuzzing against production infrastructure, or physical attacks.
- You give the project maintainers a reasonable amount of time to resolve the issue before making any information public.

---

## 3. Supported Versions

Security updates are applied to the latest tagged release and the `main` branch.

| Version   | Supported | Notes                         |
| :-------- | :-------- | :---------------------------- |
| `0.1.x`   | Yes       | Current active release branch |
| `< 0.1.0` | No        | Prototype pre-releases        |

---

## 4. Security Architecture & Threat Model

For engineering details regarding our threat model, OWASP Top 10 mitigations, Content-Security-Policy (CSP), rate limits, and audit logs, please review the internal [Security Plan](docs/SECURITY.md) and [AI & Developer Context](AI_CONTEXT.md).

---

## 5. Automated Safeguards & Invariants

- **Community Isolation:** Every database operation is scoped by `req.user.community_id` extracted from the server-validated JWT session.
- **Abuse Escalation:** Automated strike tracking backed by Upstash Redis temporarily mutes accounts triggering 3 content rejections in 10 minutes.
- **Zero-Contact Invariant:** Automated regex filters bar phone numbers and email addresses across posts and direct messages.
- **Secret Hygiene:** Continuous automated git history scanning (`gitleaks` in CI and `npm run security:scan` locally).
- **Zero-PII Observability:** Sentry error telemetry runs through `scrubSentryEvent`, redacting cookies, auth headers, display names, and request bodies.
