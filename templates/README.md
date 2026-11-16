# Templates

Copy these into the repo root keeping their paths (drop the `templates/` prefix). The agent installs the matching npm packages on Day 1/Day 2 and **must verify option names against the installed versions** (Husky, commitlint, lint-staged and GitHub Actions change over time).

| File                                     | Goes to                    | Used on               |
| ---------------------------------------- | -------------------------- | --------------------- |
| `commitlint.config.js`                   | `commitlint.config.js`     | Day 1                 |
| `.husky/commit-msg`, `.husky/pre-commit` | `.husky/`                  | Day 1                 |
| `lint-staged.config.js`                  | `lint-staged.config.js`    | Day 1                 |
| `.editorconfig`, `.gitmessage`           | repo root                  | Day 1                 |
| `.github/workflows/ci.yml`               | `.github/workflows/ci.yml` | Day 1 (E2E job Day 3) |
| `.github/dependabot.yml`                 | `.github/dependabot.yml`   | Day 1                 |
| `.github/pull_request_template.md`       | same                       | Day 1                 |
| `.github/ISSUE_TEMPLATE/*`               | same                       | Day 1                 |
| `SECURITY.md`                            | repo root                  | Day 4                 |
| `CHANGELOG.md`                           | repo root                  | Day 4                 |
