import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.js'],
    setupFiles: ['./tests/helpers/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'templates/**',
        'coverage/**',
        '**/*.config.js',
        'tests/**'
      ]
    }
  }
});
