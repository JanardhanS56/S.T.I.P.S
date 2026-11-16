# Roadmap After v0.1.0

## Next (v0.2 to v0.3)
- Admin setting to allow student-student DMs (with stricter limits)
- Notifications digest inside the app; per-user mute of categories
- Poll variants: multi-choice, anonymous results export CSV for the office
- Per-department communities/channels within a campus
- Search (posts, people) with Postgres full-text
- Multi-admin and department moderators with scoped rights
- Dark mode and a fuller accessibility audit with real assistive-tech users
- Supabase Realtime for messages (requires explicit per-table RLS policies; update D1/D8)

## Later
- TypeScript migration; stricter lint rules
- Installable PWA (offline read-only feed)
- Image attachments with scanning (large safety implications; needs review first)
- SSO with the institute's identity provider
- Multi-language UI (Kannada, Hindi, others) with moderation lists per language
- Analytics that are cookieless, server-side and documented (decision D15 change)
- Python service for batch moderation or insights
- Mobile apps

## Parking lot rules
New ideas go here or in `PROGRESS.md` > Parked ideas. They do not enter a day plan without the owner's decision.
