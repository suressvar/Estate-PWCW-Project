import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { testRoot, testAppDir, assertTestServerStopped } from './test-paths.cjs';
import { testPort } from './test-paths.cjs';
import { sourceFingerprint } from './test-freshness.cjs';
if (!fs.existsSync(path.join(testAppDir, '.isolated-test-copy'))) throw new Error('Prepare the isolated test application first.');
await assertTestServerStopped();
const result = spawnSync(process.execPath, [path.join(testRoot, 'node_modules/next/dist/bin/next'), 'build', testAppDir, '--webpack'], { cwd: testRoot, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const evidence = process.env.TEST_EVIDENCE_DIR || testRoot;
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(path.join(evidence, 'integration-build-output.txt'), `${result.stdout || ''}\n${result.stderr || ''}`);
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.error) throw result.error;
if (result.status === 0) {
  const source = sourceFingerprint(testAppDir);
  if (source !== sourceFingerprint(testRoot)) throw new Error('Application changed while building; rerun the tests to capture the current source.');
  fs.writeFileSync(path.join(testAppDir, 'tested-build.json'), JSON.stringify({ source, port: testPort, buildId: fs.readFileSync(path.join(testAppDir, '.next/BUILD_ID'), 'utf8').trim() }, null, 2));
}
process.exitCode = result.status ?? 1;
