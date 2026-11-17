import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { scryptSync } from 'node:crypto';
const reportName = process.env.INTEGRATION_REPORT_NAME || 'integration';
const workspace = path.resolve(__dirname);

export default defineConfig({
  workers: 1,
  timeout: 30000,
  expect: { timeout: 5000 },
  outputDir: path.join(workspace, `${reportName}-artifacts`),
  reporter: [['list'], ['json', { outputFile: path.join(workspace, `${reportName}-results.json`) }], ['html', { outputFolder: path.join(workspace, `${reportName}-report`), open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3107',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
  },
  projects: [
    { name: 'integration-validation', testDir: './integration' },
    { name: 'existing-browser', testDir: './.integration-app/legacy-e2e' },
    { name: 'firefox-browser', testDir: './integration', testMatch: 'browser.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit-browser', testDir: './integration', testMatch: 'browser.spec.ts', use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: 'node ../node_modules/next/dist/bin/next start . --port 3107',
    cwd: path.join(workspace, '.integration-app'),
    url: 'http://localhost:3107/login',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ESTATE_ADMIN_USERNAME: 'Admin',
      ESTATE_ADMIN_PASSWORD_HASH: `integration-test-salt:${scryptSync('Integration-Test-Password-Only-2026!', 'integration-test-salt', 64).toString('hex')}`,
      ESTATE_SESSION_SECRET: 'isolated-integration-session-secret-never-use-in-production-2026',
    },
  },
});
