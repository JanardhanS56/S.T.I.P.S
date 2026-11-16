# Design System and UX Spec

Goal: a calm, serious-but-friendly campus tool that does **not** look AI-generated or templated. Black and white with a restrained green. Editorial typography. No logo yet (wordmark only).

## 1. Principles

1. **Content first.** Posts, polls and messages are the UI. Chrome stays quiet.
2. **Clear roles.** Teacher/admin badges are visible everywhere a name appears.
3. **Kind by default.** Copy never blames. Errors say what to do next.
4. **Fast on a phone.** Most students will use a phone. Mobile is designed first.
5. **Accessible always.** WCAG 2.2 AA is the floor.

## 2. Tokens (CSS variables in `src/styles.css`; do not add colors outside this list)

| Token     | Value     | Use                                            |
| --------- | --------- | ---------------------------------------------- |
| `--ink`   | `#0e0f0d` | text, primary buttons, sidebar                 |
| `--paper` | `#fafaf7` | page background                                |
| `--line`  | `#d9dcd6` | borders, dividers                              |
| `--mute`  | `#4a4f48` | secondary text (4.5:1 on paper)                |
| `--wash`  | `#edeee9` | subtle fills                                   |
| `--green` | `#1f5a3a` | brand accent, links, teacher badge             |
| `--fern`  | `#3f8f5b` | secondary accent, focus on dark, create button |
| `--leaf`  | `#9ad1a8` | highlights, focus ring, selected bars          |
| `--mint`  | `#e6f0e4` | selected rows, soft panels                     |
| `--alert` | `#a33b1f` | errors, warnings, counters near limit          |

Rule: green is an accent, never a page fill. Max two accent colors on one screen. Never rely on color alone; pair with text or icon shape.

## 3. Typography

- Display and body: **Schibsted Grotesk** (400, 500, 700, 800). Labels and data: **IBM Plex Mono** (400, 500). Fallback: system-ui / ui-monospace.
- Scale: 13 (small), 15 (UI), 16 (body input), 17 (post body), 19 (lead), 24 (card title), 36 (page title), 44 (section), clamp(48px, 8vw, 84px) (hero).
- Headline letter-spacing: `-0.02em` to `-0.035em`. Mono labels: uppercase, `0.08em`, 11-13px.
- Never use: Inter, Roboto, Arial as the visible face; emoji as icons; gradient text.

## 4. Spacing, shape, motion

- 4px base grid; common steps 8, 12, 16, 20, 24, 32, 48, 56, 96.
- Radius: **2px** everywhere (deliberately square, not pill-shaped). Borders 1px `--line`, emphasis 1.5px `--ink`.
- No drop shadows except the cookie banner border. No gradients. No glassmorphism.
- Motion: only for feedback (hover color, 150ms). Respect `prefers-reduced-motion`; no auto-playing animation.
- Touch targets at least 44x44px.

## 5. Components (one implementation each; reuse, do not fork)

Button (dark, green, outline, large) | Chip (filter, toggle) | Badge (role, category tag) | Card | Input, Textarea, Select with visible label | Poll option (button with fill bar) | Message bubble | Thread row | Table | Banner (cookie, notice, error, success) | Empty state | Skeleton/loading | Modal (focus trapped, Esc closes) | Toast (polite live region).
States required for each interactive component: default, hover, focus-visible, active, disabled, loading, error.

## 6. Layout

- App shell: 260px dark sidebar + content, content max 860px. Below 760px the sidebar becomes a top bar with a menu button (to build on Day 3).
- Landing: 1200px container, hero split 2 columns, wraps to 1 column.
- Never horizontal page scroll. Tables scroll inside their own container.

## 7. Page inventory

| Route                 | Page                                            | Auth  | States to design                                    |
| --------------------- | ----------------------------------------------- | ----- | --------------------------------------------------- |
| `/`                   | Landing                                         | no    | default                                             |
| `/signin`             | Sign in, first-password change, join by code    | no    | error, locked, loading                              |
| `/app/feed`           | Community feed                                  | yes   | empty, loading, error, filtered-empty, rate-limited |
| `/app/feed/:id`       | Post with replies                               | yes   | not found, locked                                   |
| `/app/polls`          | Polls open/closed                               | yes   | empty, voted, closed, error                         |
| `/app/messages`       | Threads and chat                                | yes   | no threads, no one selected, blocked, rate-limited  |
| `/app/profile`        | Profile, password, sessions, data export/delete | yes   | saved, error                                        |
| `/app/create`         | Post, Poll, Admin tools                         | yes   | validation errors                                   |
| `/app/admin`          | Members, reports, audit log                     | admin | empty, confirm dialogs                              |
| `/privacy`            | Privacy policy                                  | no    |                                                     |
| `/terms`              | Terms of use                                    | no    |                                                     |
| `/cookies`            | Cookie notice                                   | no    |                                                     |
| `/guidelines`         | Community guidelines                            | no    |                                                     |
| `/accessibility`      | Accessibility statement                         | no    |                                                     |
| `/contact`            | Contact the office / grievance contact          | no    |                                                     |
| `*`                   | 404                                             | no    |                                                     |
| (error boundary)      | 500 / crash screen                              | any   |                                                     |
| `/offline` (optional) | Offline notice                                  | any   |                                                     |

## 8. Accessibility checklist (WCAG 2.2 AA)

- Every input has a visible `<label>`; icon-only buttons have `aria-label`.
- Use real `<button>`, `<a>`, `<input>`; never click handlers on div/span.
- Visible focus ring: 3px `--leaf`, 2px offset. Tab order matches visual order. Skip-to-content link.
- Contrast: text 4.5:1 (3:1 for 24px+). Check `--mute` text on `--wash` and white.
- Errors: `role="alert"`, tied to the field with `aria-describedby`.
- Live updates (new messages, toasts): `aria-live="polite"`.
- Respect zoom to 200% and `prefers-reduced-motion`; page `lang="en"`; one `<h1>` per page.
- Test with keyboard only and with axe on every page (see `TESTING.md`).

## 9. Voice and copy

Plain, warm, brief. Address the user as "you". Examples: "You can post 10 times an hour. Take a short break." not "Rate limit exceeded." Avoid slang the office would not use; avoid exclamation marks; no emoji in UI chrome.

## 10. Anti-"AI-look" rules

No centered hero with gradient blob, no three identical icon cards, no left-border accent cards, no lorem ipsum, no fake stats or testimonials, no stock sparkle icons, no all-rounded pills. Use asymmetry, real hierarchy, real content.

## 11. Responsive breakpoints

Mobile first. Breakpoints: 480, 760, 1024, 1280. Tables and long words wrap or scroll inside containers.

## 12. Dark mode

Out of scope for v1.0 (see ROADMAP). Do not half-implement.
