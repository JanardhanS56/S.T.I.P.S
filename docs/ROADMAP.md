# Roadmap and honest limits

## Before launch (recommended)
- [ ] Review and complete the legal text with a qualified person; decide the policy for minors
- [ ] Extend `server/blocklist.txt` for your languages and campus slang
- [ ] Add automated tests for auth, voting and community isolation
- [ ] Strict global rate limiting (Upstash Redis or Vercel firewall)
- [ ] Security review and a small load test
- [ ] Decide a data retention period and write the deletion procedure
- [ ] Add an admin audit log

## Next features
- Replies and threads on posts; reactions
- Student-to-student DMs as an optional admin setting
- Block user in messages
- Supabase Realtime for instant messages
- Anonymous polls option; poll results export for the office
- Multi-admin and department-level moderators
- Dark mode, accessibility audit, mobile layout polish
- Optional Python service for analytics or heavier moderation
