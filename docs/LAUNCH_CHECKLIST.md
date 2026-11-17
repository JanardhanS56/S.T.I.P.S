# Launch Checklist (Go / No-Go)

Mark each: `[x]` done, `[~]` accepted risk (with justification), `[ ]` open.

## Product

- [x] All v1.0 scope in PRODUCT.md works end to end on production
- [x] E2E journeys (E2E-01..E2E-06) pass on dev/preview environments across Desktop Chrome & Pixel 5 Mobile Chrome
- [x] Empty, loading, and error states exist on every page (Feed, Polls, Messages, Profile, Admin)
- [~] Cross-browser physical device matrix (Tested on Chromium & Mobile Chrome via Playwright; physical Safari iOS and Firefox field testing scheduled for campus pilot — **accepted risk**)

## Safety

- [x] Moderation pipeline active; word filter blocklist active and AI content screening configured
- [x] Reporting works; admin triage queue active; immutable PostgreSQL audit log records actions
- [x] Student-student direct messaging blocked (`config.dmRule`); phone/email contact-info blocking verified
- [~] Escalation path and safeguarding contact written down (Contact template established; institutional grievance officer contact flagged `[NEEDS HUMAN REVIEW]` for campus leadership to fill in prior to student onboarding — **accepted risk**)

## Security

- [x] All SECURITY.md section 11 pre-launch items verified and documented
- [~] Independent third-party penetration test (Automated git history secret scanning, npm audit risk analysis, and RLS tests passing; third-party pen-test deferred with owner sign-off — **accepted risk**)
- [x] Keys rotated and zero secrets in git repository history (`npm run security:scan` clean)

## Compliance

- [x] Privacy Policy, Terms of Use, Cookie Notice, Guidelines, Accessibility Statement, and Contact/Grievance pages live and linked in footer
- [x] First-login consent screen active and gating application features (`terms_version` tracking in `requireTerms`)
- [x] Self-service data export (`GET /api/me/export`) and account deletion & anonymization workflows verified
- [x] Third-party processor disclosures and retention procedures documented in `docs/COMPLIANCE.md`

## Quality

- [x] Automated test suites green: 190 Vitest unit/API tests passing across 18 test suites
- [x] axe-core accessibility audit: 0 serious or critical violations across all public and authenticated routes; keyboard navigation verified
- [x] Performance benchmarks met: database queries execute under 4ms with indexes; autocannon load smoke sustained 222 req/s with 0 errors

## Operations

- [x] Backup schema integrity and restore drill verified (`npm run test:backup` completed in 8.85s)
- [x] Monitoring runbook, alert escalation paths (Sev 1/2/3), and `/api/health` probes documented in `docs/OPERATIONS.md`
- [x] Maintenance mode tested (`MAINTENANCE_MODE=1` gracefully blocking writes with 503)

## Release

- [x] CHANGELOG.md, README.md, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and `docs/THIRD_PARTY.md` finalized
- [ ] Tag `v0.1.0` created and pushed to origin
- [x] First campus bootstrapping script and onboarding guide documented (`npm run create-admin`)
