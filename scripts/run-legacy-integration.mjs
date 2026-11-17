import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isolated = path.join(root, '.integration-app');
if (!fs.existsSync(path.join(isolated, '.isolated-test-copy'))) throw new Error('Prepare the isolated test copy first.');
if (!fs.existsSync(path.join(isolated, '.next', 'BUILD_ID'))) throw new Error('Build the isolated test copy first.');
// Legacy tests import storage directly, so their process must also run here.
const store = path.join(isolated, 'data', 'estate-storage.json');
if (fs.existsSync(store)) fs.unlinkSync(store);
const result = spawnSync(process.execPath, [
  path.join(root, 'node_modules', '@playwright', 'test', 'cli.js'),
  'test', '-c', path.join(root, 'playwright.integration.config.ts'), '--project=existing-browser',
], { cwd: isolated, stdio: 'inherit', env: { ...process.env, INTEGRATION_REPORT_NAME: 'legacy-browser' } });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
