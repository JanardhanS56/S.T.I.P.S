# Launch Checklist (Go / No-Go)

Mark each: [x] done, [~] accepted risk (write why), [ ] open. **Any open item in Safety, Security or Compliance = No-Go.**

## Product
- [ ] All v1.0 scope in PRODUCT.md works end to end on production
- [ ] E2E-01..10 pass on a preview identical to production
- [ ] Empty, loading and error states exist on every page
- [ ] Works on a real phone, Chrome, Firefox, Safari

## Safety
- [ ] Moderation pipeline active; blocklist reviewed for your language(s)
- [ ] Reporting works; admin queue tested; audit log records actions
- [ ] Student-student DMs off; contact-info blocking tested
- [ ] Escalation path and safeguarding contact written down `[NEEDS HUMAN REVIEW]`

## Security
- [ ] All SECURITY.md section 11 items done
- [ ] Independent review done or consciously deferred with owner sign-off
- [ ] Keys rotated after the last time they were shown anywhere

## Compliance
- [ ] Privacy, Terms, Cookies, Guidelines, Accessibility, Contact live and accurate
- [ ] Consent screen and (if required) guardian consent process agreed with the institute
- [ ] Data export and deletion flows tested
- [ ] Processor list correct; retention jobs documented

## Quality
- [ ] CI green on main; coverage targets met
- [ ] axe: 0 serious/critical; keyboard pass done
- [ ] Performance targets met `[TARGETS]`

## Operations
- [ ] Backups configured and **a restore was tested**
- [ ] Monitoring and alerts live; runbook read by owner
- [ ] Rollback rehearsed once
- [ ] Maintenance mode tested

## Release
- [ ] CHANGELOG, LICENSE, README, THIRD_PARTY updated
- [ ] Tag `v0.1.0` and GitHub Release created
- [ ] First campus onboarding plan written
