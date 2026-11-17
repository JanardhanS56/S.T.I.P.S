# Contributing to S.T.I.P.S

Thank you for your interest in contributing to the **Student-Teacher Interaction & Polling System (S.T.I.P.S)**.

S.T.I.P.S is designed as a secure, privacy-first communication system for educational institutions. Because the platform serves student and teacher communities, code quality, security controls, and strict compliance boundaries are non-negotiable.

---

## 1. Development Principles

1. **Security & Privacy First:** All routes authenticate requests, enforce community isolation, and reject cross-tenant access with HTTP 404. Student contact details are never exposed.
2. **Never Break RLS:** Anonymous PostgreSQL database access must remain denied (`deny-all`). Service-role access is strictly server-side.
3. **Micro-Commit Discipline:** All changes must follow [Conventional Commits](https://www.conventionalcommits.org/) and pass automated linting and formatting hooks.
4. **Zero-PII Error Handling:** Logs and telemetry must never record authorization headers, cookies, passwords, usernames, display names, emails, or request bodies.

---

## 2. Git and Branch Workflow

1. Always branch from latest `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b <type>/<description>
   ```

   _Accepted branch prefixes:_ `feat/`, `fix/`, `chore/`, `docs/`, `test/`, `perf/`.

2. **Commit Message Rules:**
   - Commit messages are enforced by `@commitlint/cli` and `husky`.
   - **Format:** `<type>(<scope>): <subject>`
   - **Subject:** Strictly lowercase, max 72 characters, imperative mood without trailing period.
   - **Allowed Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - **Allowed Scopes:** `auth`, `posts`, `polls`, `messages`, `reports`, `admin`, `moderation`, `limits`, `db`, `api`, `ui`, `a11y`, `legal`, `privacy`, `deps`, `ci`, `tests`, `ops`, `docs`, `config`, `logging`, `progress`, `perf`, `security`, `e2e`.

3. **Merges:**
   - Never squash commits into `main`. Always create a standard merge commit (`git merge --no-ff`) to preserve atomic development history.

---

## 3. Local Development Setup

1. Install Node.js 20 or newer:

   ```bash
   npm install
   ```

2. Copy environment file and provide credentials:

   ```bash
   cp .env.example .env
   ```

3. Run development services:

   ```bash
   npm run dev:api     # Backend API on http://localhost:3001
   npm run dev         # Frontend Vite on http://localhost:5173
   ```

4. Bootstrap initial campus community and administrator:
   ```bash
   npm run create-admin -- "Campus Name" "Principal Name"
   ```

---

## 4. Verification Suite

Before submitting any pull request, ensure all verification suites pass cleanly:

```bash
npm run lint          # ESLint checks
npm run format:check  # Prettier style check
npm test              # Vitest unit and integration test suite
npm run test:e2e      # Playwright end-to-end and accessibility tests
npm run build         # Vite production build
npm run security:scan # Secret detection check
```

---

## 5. Security & Bug Disclosures

If you discover a security vulnerability, please do **NOT** open a public issue. Follow the instructions in [SECURITY.md](SECURITY.md) to report findings privately.
