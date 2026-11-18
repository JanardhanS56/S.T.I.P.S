# Git Conventions: Micro-Commits That Tell the Story

Goal: a clean, readable history where **every commit is one small, working, meaningful step**. Done honestly, this also fills your GitHub contribution graph with real work.

## 1. The micro-commit rule

> If you can describe the change with one short sentence and it builds, commit it.

- One logical change per commit. A commit should be reviewable in under a minute.
- Every commit builds and passes lint and tests that exist at that point.
- Never mix refactor + behavior + formatting in one commit.
- Typical sizes: 1 to 5 files, under about 80 changed lines (generated files and lockfiles excepted).
- Target rhythm: **8 to 20 commits per working day**. A task in the plans usually yields 2 to 4 commits.
- Commit **when green**, not at the end of the day. Use `git add -p` to stage only the lines for this change.

## 2. Message format (Conventional Commits)

```
type(scope): imperative summary in lower case, max 72 chars

optional body: WHY, not what. wrap at 72.

Refs: D2-05, AUTH-03
```

Rules: imperative mood ("add", "fix", "remove"), no trailing period, scope in lower-case, reference plan task and test IDs in the footer when relevant. Breaking change: `feat(api)!: ...` plus `BREAKING CHANGE:` footer.

### Types

| Type     | Use for                          |
| -------- | -------------------------------- |
| feat     | new user-visible behavior        |
| fix      | bug fix                          |
| test     | adding/changing tests only       |
| docs     | documentation only               |
| refactor | restructure, no behavior change  |
| perf     | performance improvement          |
| style    | formatting, whitespace, no logic |
| chore    | tooling, config, housekeeping    |
| build    | build system, dependencies       |
| ci       | CI/CD config                     |
| security | security hardening or fix        |
| revert   | reverts a commit                 |

### Scopes (use these; ask before inventing new ones)

`auth` `posts` `polls` `messages` `reports` `admin` `moderation` `limits` `db` `api` `ui` `a11y` `legal` `deps` `ci` `tests` `ops` `docs` `config` `logging`

### Good vs bad

| Good                                                 | Bad                                   |
| ---------------------------------------------------- | ------------------------------------- |
| `test(auth): cover wrong-password lockout (AUTH-03)` | `update tests`                        |
| `fix(polls): reject votes on closed polls`           | `fixed stuff`                         |
| `feat(posts): add reply endpoint with depth limit`   | `feat: lots of changes`               |
| `chore(deps): add vitest and supertest`              | `added packages and also changed css` |
| `docs(security): record CSP decision`                | `docs`                                |

## 3. A typical task as commits (example: "rate limit posts")

1. `test(limits): add failing test for 11th post in an hour (POST-04)`
2. `feat(limits): add per-user hourly counter helper`
3. `feat(posts): enforce hourly cap with Retry-After header`
4. `refactor(limits): move window constants to config`
5. `docs(api): document 429 response for posts`
   This is "red, green, refactor, document" and gives a natural rhythm.

## 4. Branches

- `main`: always deployable, protected (require PR, require CI green, no force push).
- Feature branches: `feat/<day>-<topic>`, e.g. `feat/d2-rate-limits`, `fix/d3-poll-percent`, `docs/d1-kit`, `chore/d1-eslint`.
- One branch per plan phase (A, B, C, D) is a good size: 1 to 2 hours of work, 5 to 15 commits.
- Rebase on `main` before opening a PR: `git fetch && git rebase origin/main`.

## 5. Pull requests

- One PR per phase. Use `.github/pull_request_template.md` (what, why, how tested, screenshots, checklist).
- **Merge method: "Create a merge commit" or "Rebase and merge". Do not squash**, so the micro-commits stay in history (decision D12). In GitHub: repo Settings > General > Pull Requests, disable "Allow squash merging".
- Even as a solo developer, use PRs: they give CI a gate and a readable log.

## 6. Tags and releases

Semantic Versioning. `v0.1.0` after Day 4 (first deployable product). Patch for fixes, minor for features. Create a GitHub Release with the changelog. Keep `CHANGELOG.md` in "Keep a Changelog" format (Added, Changed, Fixed, Security).

## 7. What never goes into git

`.env`, any key or token, `node_modules`, `dist`, personal data, database dumps, screenshots with real student data. If a secret is committed: **rotate it first**, then clean history (BFG or `git filter-repo`), then force-push only with the owner's explicit approval.

## 8. Local setup

- Commit template: `git config commit.template .gitmessage` (file below).
- Hooks (Husky): `pre-commit` runs lint-staged (eslint + prettier on staged files) and a secret check; `commit-msg` runs commitlint. Configs are in `.husky/` and root config files.
- Use `git commit -v` to review the diff while writing the message.
- Fix the last commit message before pushing: `git commit --amend`. Never amend or rebase pushed shared history.

`.gitmessage`:

```
# type(scope): summary (max 72 chars, imperative, lower case)

# Why (optional body, wrap at 72)

# Refs: D2-05, AUTH-03
```

## 9. About the GitHub contribution graph (honest notes)

- Contributions count commits made on the repo's **default branch** (or gh-pages) and merged PRs, authored with an **email address linked to your GitHub account** (set `git config user.email` to the verified or noreply address).
- Commits on unmerged feature branches do not show until merged. Rebase/merge-commit keeps each micro-commit; squash collapses them into one.
- Private repository work only shows if "Include private contributions on my profile" is enabled in your profile settings.
- Forks count only after the work is merged into the parent's default branch.
- Do **not** pad the graph with empty or meaningless commits. Reviewers and employers read history; small honest commits are both a better habit and a better signal. If a day has real work, the micro-commit rule produces plenty of squares naturally.

## 10. Daily git routine

1. Morning: `git switch main && git pull`, create the phase branch.
2. Work in red-green-refactor loops; commit each green step.
3. Before lunch/end of phase: push, open PR, wait for CI, merge (no squash).
4. Evening: update `docs/PROGRESS.md` in a `docs(progress): ...` commit; `git log --oneline --since=midnight` to review the day.
