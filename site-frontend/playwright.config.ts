import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  timeout: 60000,
  retries: 0,
  outputDir: '../.local/playwright',
  reporter: [['list']],
  use: {
    browserName: 'chromium',
    channel: process.env.E2E_BROWSER || 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  }
});
