# Authorization Matrix

This document maps every route in S.T.I.P.S to its required authentication, roles, account status conditions, and community scoping behavior, reflecting the backend code line by line.

## Legend

- **Public**: No cookie required.
- **Admin**: `req.user.role === 'admin'`.
- **Teacher**: `req.user.role === 'teacher'`.
- **Student**: `req.user.role === 'student'`.
- **Active**: `req.user.status === 'active'`.
- **Muted**: `req.user.status === 'muted'` (read-only; blocked from writing user content).
- **Suspended**: `req.user.status === 'suspended'` (blocked at `requireAuth` with 401 `Account unavailable.`, or at login with 403).
- **No Community**: Account without an assigned `community_id` (blocked by `requireCommunity` with 403 `Join a community first.`).
- **Foreign Object**: Attempting to access or reference an object belonging to a different `community_id` returns **404 Not Found** (never 403), preventing cross-community enumeration.

---

## Route Matrix

| Route                                 | Method | Auth Middleware                                  | Allowed Roles           | Muted Allowed | Community Required | Foreign ID Behavior | Notes                                                                       |
| ------------------------------------- | ------ | ------------------------------------------------ | ----------------------- | ------------- | ------------------ | ------------------- | --------------------------------------------------------------------------- |
| `/api/health`                         | GET    | None                                             | Public                  | Yes           | No                 | N/A                 | Liveness + DB ping check                                                    |
| `/api/auth/login`                     | POST   | None (Rate limited)                              | Public                  | Yes           | No                 | N/A                 | Rate limited per IP and DB lockout                                          |
| `/api/auth/logout`                    | POST   | None                                             | Public                  | Yes           | No                 | N/A                 | Clears session cookie                                                       |
| `/api/auth/logout-all`                | POST   | `requireAuth`                                    | Admin, Teacher, Student | Yes           | No                 | N/A                 | Bumps `token_version` to revoke all sessions                                |
| `/api/auth/me`                        | GET    | `requireAuth`                                    | Admin, Teacher, Student | Yes           | No                 | N/A                 | Returns current user profile and community                                  |
| `/api/auth/join`                      | POST   | `requireAuth`                                    | Admin, Teacher, Student | Yes           | No                 | 404 invalid code    | Only allowed if user has no community (409 if joined)                       |
| `/api/auth/change-password`           | POST   | `requireAuth`                                    | Admin, Teacher, Student | Yes           | No                 | N/A                 | Enforces password policy & bumps `token_version`                            |
| `/api/auth/profile`                   | PATCH  | `requireAuth, requireNotMuted`                   | Admin, Teacher, Student | No (403)      | No                 | N/A                 | Content screened for profanity and contact info                             |
| `/api/posts`                          | GET    | `requireAuth, requireCommunity`                  | Admin, Teacher, Student | Yes           | Yes (403)          | Filtered            | Only returns posts where `community_id = req.user.community_id`             |
| `/api/posts`                          | POST   | `requireAuth, requireCommunity, requireNotMuted` | Admin, Teacher, Student | No (403)      | Yes (403)          | N/A                 | Author and community set strictly from session                              |
| `/api/posts/:id`                      | DELETE | `requireAuth, requireCommunity`                  | Author or Admin         | Yes           | Yes (403)          | 404                 | Soft delete (`status = 'hidden'`); non-author non-admin gets 403            |
| `/api/polls`                          | GET    | `requireAuth, requireCommunity`                  | Admin, Teacher, Student | Yes           | Yes (403)          | Filtered            | Scoped to user's community; results masked until voted/closed/admin         |
| `/api/polls`                          | POST   | `requireAuth, requireCommunity, requireNotMuted` | Admin, Teacher, Student | No (403)      | Yes (403)          | N/A                 | 2 to 6 options; 1 to 7 days; screened                                       |
| `/api/polls/:id/vote`                 | POST   | `requireAuth, requireCommunity, requireNotMuted` | Admin, Teacher, Student | No (403)      | Yes (403)          | 404                 | Option must belong to poll (400); duplicate vote returns 409                |
| `/api/messages/people`                | GET    | `requireAuth, requireCommunity`                  | Admin, Teacher, Student | Yes           | Yes (403)          | Filtered            | Active members only; students only see teachers/admins under default dmRule |
| `/api/messages/threads`               | GET    | `requireAuth, requireCommunity`                  | Admin, Teacher, Student | Yes           | Yes (403)          | Filtered            | Scoped strictly to conversations involving requester                        |
| `/api/messages/with/:userId`          | GET    | `requireAuth, requireCommunity`                  | Admin, Teacher, Student | Yes           | Yes (403)          | 404                 | Messages between requester and target; target must belong to same community |
| `/api/messages`                       | POST   | `requireAuth, requireCommunity, requireNotMuted` | Admin, Teacher, Student | No (403)      | Yes (403)          | 404                 | Recipient must be active in same community; student-student blocked (403)   |
| `/api/reports`                        | POST   | `requireAuth, requireCommunity`                  | Admin, Teacher, Student | Yes           | Yes (403)          | 404                 | Target post/poll/message must exist in requester's community                |
| `/api/admin/members`                  | POST   | `requireAuth, requireAdmin, requireCommunity`    | Admin                   | No (401/403)  | Yes (403)          | N/A                 | Bulk creates members up to 200 in admin's community                         |
| `/api/admin/community`                | GET    | `requireAuth, requireAdmin, requireCommunity`    | Admin                   | No (401/403)  | Yes (403)          | N/A                 | Returns name and join code for admin's community                            |
| `/api/admin/reports`                  | GET    | `requireAuth, requireAdmin, requireCommunity`    | Admin                   | No (401/403)  | Yes (403)          | Filtered            | Returns open reports for admin's community only                             |
| `/api/admin/reports/:id/resolve`      | POST   | `requireAuth, requireAdmin, requireCommunity`    | Admin                   | No (401/403)  | Yes (403)          | 404                 | Report must belong to admin's community                                     |
| `/api/admin/users/:id/status`         | POST   | `requireAuth, requireAdmin, requireCommunity`    | Admin                   | No (401/403)  | Yes (403)          | 404                 | Target user must be non-admin in admin's community                          |
| `/api/admin/users/:id/reset-password` | POST   | `requireAuth, requireAdmin, requireCommunity`    | Admin                   | No (401/403)  | Yes (403)          | 404                 | Target user must be non-admin in admin's community; revokes target sessions |

---

## Invariants Verified

1. **Deny-by-default**: Every route requiring authentication mounts `requireAuth`.
2. **Community Isolation**: Every query accessing user-generated content strictly matches `community_id = req.user.community_id`.
3. **No Cross-Community Probing (404, not 403)**: Accessing an object by ID from a foreign community behaves identically to a non-existent object (`404 Not Found`).
4. **Session Trust Only**: `req.user.community_id` and `req.user.id` are taken directly from the verified session token and database user lookup. Client-supplied IDs in request bodies or query parameters are never trusted for tenant scoping.
5. **Admin Self-Protection**: Admins cannot mute, suspend, or reset passwords of other admin accounts (returns 404).
