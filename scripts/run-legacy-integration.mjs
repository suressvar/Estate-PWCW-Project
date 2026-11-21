import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { testAppDir, assertTestServerStopped } from './test-paths.cjs';
import { ensureTestBuild } from './ensure-test-build.mjs';
ensureTestBuild();
process.env.ESTATE_TEST_RUNNER = '1';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isolated = testAppDir;
await assertTestServerStopped();
if (!fs.existsSync(path.join(isolated, '.isolated-test-copy'))) throw new Error('Prepare the isolated test copy first.');
if (!fs.existsSync(path.join(isolated, '.next', 'BUILD_ID'))) throw new Error('Build the isolated test copy first.');
// Legacy tests import storage directly, so their process must also run here.
// Remove only disposable test snapshots together. Retaining a backup while deleting
// its live file correctly triggers the application's missing-file protection.
for (const name of ['estate-storage.json', 'estate-storage.json.bak']) {
  const store = path.join(isolated, 'data', name);
  if (fs.existsSync(store)) fs.unlinkSync(store);
}
const result = spawnSync(process.execPath, [
  path.join(root, 'node_modules', '@playwright', 'test', 'cli.js'),
  'test', '-c', path.join(root, 'playwright.integration.config.ts'), '--project=existing-browser',
], { cwd: isolated, stdio: 'inherit', env: { ...process.env, INTEGRATION_REPORT_NAME: 'legacy-browser' } });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
