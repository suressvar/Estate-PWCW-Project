import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { scryptSync } from 'node:crypto';
import { testAppDir, testBaseURL, testPort } from './scripts/test-paths.cjs';
const reportName = process.env.INTEGRATION_REPORT_NAME || 'integration';
const workspace = path.resolve(__dirname);
process.env.ESTATE_TEST_ROOT = workspace;
const evidence = process.env.TEST_EVIDENCE_DIR || workspace;

export default defineConfig({
  globalSetup: './scripts/check-test-build.cjs',
  workers: 1,
  timeout: 30000,
  expect: { timeout: 5000 },
  outputDir: path.join(evidence, `${reportName}-artifacts`),
  reporter: [['list'], ['json', { outputFile: path.join(evidence, `${reportName}-results.json`) }], ['html', { outputFolder: path.join(evidence, `${reportName}-report`), open: 'never' }]],
  use: {
    baseURL: testBaseURL,
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
  },
  projects: [
    { name: 'integration-validation', testDir: './integration' },
    { name: 'existing-browser', testDir: path.join(testAppDir, 'legacy-e2e') },
    { name: 'firefox-browser', testDir: './integration', testMatch: ['browser.spec.ts', 'black-box-session.spec.ts'], use: { browserName: 'firefox' } },
    { name: 'webkit-browser', testDir: './integration', testMatch: ['browser.spec.ts', 'black-box-session.spec.ts'], use: { browserName: 'webkit' } },
  ],
  webServer: {
    command: `node ../node_modules/next/dist/bin/next start . --port ${testPort}`,
    cwd: testAppDir,
    url: `${testBaseURL}/login`,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ESTATE_ADMIN_USERNAME: 'Admin',
      ESTATE_ADMIN_PASSWORD_HASH: `integration-test-salt:${scryptSync('Integration-Test-Password-Only-2026!', 'integration-test-salt', 64).toString('hex')}`,
      ESTATE_SESSION_SECRET: 'isolated-integration-session-secret-never-use-in-production-2026',
    },
  },
});
