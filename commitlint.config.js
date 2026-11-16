// Enforces docs/GIT_CONVENTIONS.md. Requires @commitlint/cli and @commitlint/config-conventional.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'docs',
        'refactor',
        'perf',
        'style',
        'chore',
        'build',
        'ci',
        'security',
        'revert'
      ]
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'posts',
        'polls',
        'messages',
        'reports',
        'admin',
        'moderation',
        'limits',
        'db',
        'api',
        'ui',
        'a11y',
        'legal',
        'privacy',
        'deps',
        'ci',
        'tests',
        'ops',
        'docs',
        'config',
        'logging',
        'progress',
        'perf',
        'security',
        'e2e'
      ]
    ],
    'scope-empty': [2, 'never'],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 72],
    'subject-full-stop': [2, 'never', '.']
  }
};
