# API reference

All endpoints are under `/api`. Writes need `Content-Type: application/json`. Errors look like `{ "error": "message" }`. "Auth" means the session cookie is required.

| Method | Path                            | Auth           | Body / query                          | Notes                                                       |
| ------ | ------------------------------- | -------------- | ------------------------------------- | ----------------------------------------------------------- |
| GET    | /health                         | no             |                                       | liveness + database connectivity check ({ok, db})           |
| POST   | /auth/login                     | no             | `username, password`                  | 5 wrong passwords lock the account 10 min; IP limited       |
| POST   | /auth/logout                    | no             |                                       | clears cookie                                               |
| POST   | /auth/logout-all                | yes            |                                       | revokes all active sessions by bumping token_version        |
| GET    | /auth/me                        | yes            |                                       | current user + community                                    |
| POST   | /auth/join                      | yes            | `code`                                | only if the account has no community                        |
| POST   | /auth/change-password           | yes            | `current, next`                       | next is at least 10 characters                              |
| PATCH  | /auth/profile                   | yes, not muted | `displayName, bio`                    | screened                                                    |
| GET    | /posts                          | yes            | `?category=`                          | latest 50 visible posts in your community                   |
| POST   | /posts                          | yes, not muted | `body (<=280), category`              | 10 per hour, screened                                       |
| DELETE | /posts/:id                      | yes            |                                       | author or admin; hides the post                             |
| GET    | /polls                          | yes            |                                       | results shown only after you vote, after close, or to admin |
| POST   | /polls                          | yes, not muted | `question, options[2..6], days[1..7]` | 5 per day, screened                                         |
| POST   | /polls/:id/vote                 | yes, not muted | `optionId`                            | one vote each (409 if repeated)                             |
| GET    | /messages/people                | yes            |                                       | people you may message                                      |
| GET    | /messages/threads               | yes            |                                       | one entry per conversation                                  |
| GET    | /messages/with/:userId          | yes            |                                       | up to 200 messages                                          |
| POST   | /messages                       | yes, not muted | `toUserId, body (<=500)`              | 60 per hour, screened, contact info blocked                 |
| POST   | /reports                        | yes            | `targetType, targetId, reason`        | 20 per day                                                  |
| GET    | /admin/community                | admin          |                                       | name and code                                               |
| POST   | /admin/members                  | admin          | `members[{name, role}]` up to 200     | returns usernames and one-time passwords once               |
| GET    | /admin/reports                  | admin          |                                       | open reports                                                |
| POST   | /admin/reports/:id/resolve      | admin          | `action: hide or dismiss`             |                                                             |
| POST   | /admin/users/:id/status         | admin          | `status: active, muted, suspended`    | cannot target admins                                        |
| POST   | /admin/users/:id/reset-password | admin          |                                       | returns a new one-time password                             |

Status codes you will see: 400 invalid input, 401 not signed in, 403 not allowed, 404 not found, 409 conflict (already voted, poll closed), 422 blocked by moderation, 429 rate limited.
