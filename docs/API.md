# API reference

All endpoints are under `/api`. Writes need `Content-Type: application/json`. Errors look like `{ "error": "message" }`. "Auth" means the session cookie is required.

| Method | Path                                 | Auth           | Body / query                                                | Notes                                                                                |
| ------ | ------------------------------------ | -------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| GET    | /.well-known/security.txt            | no             |                                                             | RFC 9116 security disclosure policy                                                  |
| GET    | /health                              | no             |                                                             | liveness + database connectivity check ({ok, db})                                    |
| POST   | /auth/login                          | no             | `username, password`                                        | 10 attempts/15m per IP & user; 5 failures locks acct 10 min                          |
| POST   | /auth/logout                         | no             |                                                             | clears cookie                                                                        |
| POST   | /auth/logout-all                     | yes            |                                                             | revokes all active sessions by bumping token_version                                 |
| GET    | /auth/me                             | yes            |                                                             | current user + community                                                             |
| POST   | /auth/join                           | yes            | `code`                                                      | only if the account has no community                                                 |
| POST   | /auth/change-password                | yes            | `current, next`                                             | next is at least 10 characters                                                       |
| PATCH  | /auth/profile                        | yes, not muted | `displayName, bio, department, rollNumber, section`         | screened personal details                                                            |
| POST   | /auth/consent                        | yes            | `version: number`                                           | records consent to terms & privacy policy                                            |
| GET    | /me/export                           | yes            |                                                             | GDPR/DPDP user data JSON archive (rate limit: 1 per day)                             |
| POST   | /me/delete-request                   | yes            | `reason?: string`                                           | submits account deletion and anonymization request                                   |
| GET    | /me/delete-request                   | yes            |                                                             | returns pending deletion request status if any                                       |
| GET    | /posts                               | yes            | `?category=&before=&limit=`                                 | cursor-paginated visible posts (limit <= 50); default feed cached in Redis (15s TTL) |
| GET    | /posts/:id                           | yes            |                                                             | thread view: post with depth-1 replies and reaction counts                           |
| POST   | /posts                               | yes, not muted | `body (<=280), category`                                    | 10/hr, min 3s gap, no duplicates in 10m, screened (purges feed cache)                |
| POST   | /posts/:id/replies                   | yes, not muted | `body (<=280)`                                              | depth-1 reply; same moderation and gap limits apply                                  |
| POST   | /posts/:id/reactions                 | yes, not muted | `kind: like, thanks, laugh`                                 | toggle reaction; repeat un-reacts, new kind switches                                 |
| POST   | /posts/:id/pin                       | admin          | `isPinned: boolean`                                         | pins/unpins post to top of community feed                                            |
| POST   | /posts/:id/official                  | admin          | `isOfficial: boolean`                                       | marks post with official community badge                                             |
| DELETE | /posts/:id                           | yes            |                                                             | author or admin; hides the post                                                      |
| GET    | /polls                               | yes            |                                                             | results shown only after you vote, after close, or to admin                          |
| POST   | /polls                               | yes, not muted | `question, options[2..6], days[1..7]`                       | 5 per day, screened                                                                  |
| POST   | /polls/:id/vote                      | yes, not muted | `optionId`                                                  | one vote each (409 if repeated or closed)                                            |
| POST   | /polls/:id/close                     | yes            |                                                             | author or admin closes active poll early                                             |
| GET    | /messages/people                     | yes            |                                                             | people you may message (excludes blockers)                                           |
| GET    | /messages/threads                    | yes            |                                                             | one entry per conversation                                                           |
| GET    | /messages/unread                     | yes            |                                                             | unread message counts per sender and total unread                                    |
| GET    | /messages/blocks                     | yes            |                                                             | list of user IDs blocked by current user                                             |
| POST   | /messages/blocks                     | yes            | `targetUserId`                                              | blocks target user from sending messages                                             |
| DELETE | /messages/blocks/:targetUserId       | yes            |                                                             | unblocks target user                                                                 |
| GET    | /messages/with/:userId               | yes            |                                                             | up to 200 messages; marks thread read for reader                                     |
| POST   | /messages                            | yes, not muted | `toUserId, body (<=500)`                                    | 60 per hour, screened, contact info blocked                                          |
| POST   | /reports                             | yes            | `targetType, targetId, reason`                              | 20 per day                                                                           |
| GET    | /admin/community                     | admin          |                                                             | name and code                                                                        |
| GET    | /admin/members                       | admin          | `?role=&status=&search=`                                    | list community members with department, roll number, and section                     |
| POST   | /admin/members                       | admin          | `members[{name, role, department?, rollNumber?, section?}]` | provisioning up to 200; roles: student, teacher, non_staff, external_guide, custom   |
| GET    | /admin/reports                       | admin          |                                                             | open reports                                                                         |
| POST   | /admin/reports/:id/resolve           | admin          | `action: hide or dismiss`                                   |                                                                                      |
| GET    | /admin/deletion-requests             | admin          |                                                             | list pending account deletion requests                                               |
| POST   | /admin/deletion-requests/:id/confirm | admin          |                                                             | confirms erasure, anonymizes user to deleted-<id>, revokes sessions                  |
| POST   | /admin/deletion-requests/:id/reject  | admin          | `note?: string`                                             | rejects deletion request                                                             |
| POST   | /admin/users/:id/status              | admin          | `status: active, muted, suspended`                          | cannot target admins                                                                 |
| POST   | /admin/users/:id/reset-password      | admin          |                                                             | returns a new one-time password                                                      |
| GET    | /admin/audit                         | admin          | `?action=&limit=`                                           | audit log for community admin actions                                                |

Status codes you will see:

- 400 invalid input / bad JSON
- 401 not signed in / incorrect credentials
- 403 not allowed / account muted or suspended
- 404 not found (used for cross-community isolation)
- 409 conflict (already voted, poll closed, duplicate post text)
- 413 payload too large (body > 10kb)
- 415 unsupported media type (writes must be `application/json`)
- 422 blocked by moderation or spam filters (5 in 1 hour auto-mutes account for 1 hour)
- 429 rate limited (returns `Retry-After` seconds + `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` headers)
- 503 service unavailable / maintenance mode (`MAINTENANCE_MODE=1` blocks writes, keeps reads up) or database down
