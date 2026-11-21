import path from 'node:path';
import config from './playwright.integration.config';

const isIsolated = path.resolve(process.cwd()) === path.resolve(__dirname, '.integration-app');

if (!isIsolated) {
  // When evaluated in the workspace root (e.g. by VS Code test discovery),
  // warn instead of throwing an unhandled exception that crashes the editor runner.
  console.warn(
    '\n⚠️  [Playwright Safety Guard] Direct test runs in the root workspace are restricted to protect real estate records in data/estate-storage.json.\n👉 To run E2E tests safely, use: npm run test:e2e\n'
  );
}

const isolatedConfig = {
  ...config,
  globalSetup: isIsolated ? config.globalSetup : undefined,
  projects: isIsolated
    ? config.projects?.filter(project => project.name === 'existing-browser')
    : [],
  webServer: isIsolated ? config.webServer : undefined,
};

export default isolatedConfig;

