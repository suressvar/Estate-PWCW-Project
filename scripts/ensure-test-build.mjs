import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { testRoot } from './test-paths.cjs';
import { assertFreshTestBuild } from './test-freshness.cjs';
export function runNode(args, options = {}) {
  const result = spawnSync(process.execPath, args, { cwd: testRoot, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Test command failed (exit ${result.status ?? 'unknown'}): ${path.basename(args[0])}`);
}
export function ensureTestBuild() {
  try { assertFreshTestBuild(); return; } catch { console.log('Refreshing the isolated test application to match current code and tests.'); }
  runNode([path.join(testRoot, 'scripts/prepare-integration.mjs')]);
  runNode([path.join(testRoot, 'scripts/build-integration.mjs')]);
  assertFreshTestBuild();
}
