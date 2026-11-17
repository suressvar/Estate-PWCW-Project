import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(process.execPath, [path.join(root, 'node_modules/@playwright/test/cli.js'), 'test', '-c', path.join(root, 'playwright.integration.config.ts'), '--project=firefox-browser', '--project=webkit-browser'], { cwd: root, stdio: 'inherit', env: { ...process.env, INTEGRATION_REPORT_NAME: 'cross-browser' } });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
