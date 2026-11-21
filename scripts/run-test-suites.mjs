import fs from 'node:fs';
import path from 'node:path';
// Use a separate copy by default so another chat's port-3107 run can continue.
process.env.TEST_APP_DIR ||= '.black-box-app';
process.env.TEST_SERVER_PORT ||= process.env.TEST_APP_DIR === '.integration-app' ? '3107' : '3117';
process.env.ESTATE_TEST_RUNNER = '1';
const { testRoot } = await import('./test-paths.cjs');
const { ensureTestBuild, runNode } = await import('./ensure-test-build.mjs');
const mode = process.argv[2];
if (!['all', 'integration', 'legacy', 'cross'].includes(mode)) throw new Error('Choose all, integration, legacy or cross.');
if (mode === 'all') {
  const evidence = process.env.TEST_EVIDENCE_DIR || testRoot;
  fs.mkdirSync(evidence, { recursive: true });
  runNode([path.join(testRoot, 'node_modules/vitest/vitest.mjs'), 'run', '--coverage', '--reporter=default', '--reporter=json', `--outputFile=${path.join(evidence, 'test-results.json')}`]);
}
ensureTestBuild();
if (mode === 'all' || mode === 'integration') runNode([path.join(testRoot, 'node_modules/@playwright/test/cli.js'), 'test', '-c', path.join(testRoot, 'playwright.integration.config.ts'), '--project=integration-validation', ...process.argv.slice(3)]);
if (mode === 'all' || mode === 'legacy') runNode([path.join(testRoot, 'scripts/run-legacy-integration.mjs')]);
if (mode === 'all' || mode === 'cross') runNode([path.join(testRoot, 'scripts/run-cross-browser.mjs')]);
