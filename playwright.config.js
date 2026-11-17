import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : { channel: 'chrome' })
      }
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        ...(process.env.CI ? {} : { channel: 'chrome' })
      }
    }
  ],
  webServer: {
    command: 'node scripts/dev.js',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      PLAYWRIGHT_TEST: '1'
    }
  }
});
