/* eslint-disable @typescript-eslint/no-require-imports -- Shared CommonJS bridge for the test CLI and ESM scripts. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { testRoot, testAppDir, testPort } = require('./test-paths.cjs');
function sourceFingerprint(directory) {
  const hash = crypto.createHash('sha256');
  function walk(relative) {
    const file = path.join(directory, relative);
    if (fs.statSync(file).isDirectory()) for (const name of fs.readdirSync(file).sort()) walk(path.join(relative, name));
    else { hash.update(relative); hash.update(fs.readFileSync(file)); }
  }
  for (const name of ['src', 'public', 'package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']) walk(name);
  return hash.digest('hex');
}
function assertFreshTestBuild() {
  const message = 'The test application is missing or out of date. Run npm run test:all (or npm run test:integration) to prepare and build the current code safely.';
  try {
    if (!fs.existsSync(path.join(testAppDir, '.isolated-test-copy'))) throw Error(message);
    const stamp = JSON.parse(fs.readFileSync(path.join(testAppDir, 'tested-build.json'), 'utf8'));
    if (stamp.source !== sourceFingerprint(testRoot) || stamp.source !== sourceFingerprint(testAppDir) || stamp.port !== testPort || stamp.buildId !== fs.readFileSync(path.join(testAppDir, '.next/BUILD_ID'), 'utf8').trim()) throw Error(message);
    const expectedFiles = fs.readdirSync(path.join(testRoot, 'e2e')).filter(name => name.endsWith('.ts')).sort();
    const copiedFiles = fs.readdirSync(path.join(testAppDir, 'legacy-e2e')).filter(name => name.endsWith('.ts')).sort();
    if (JSON.stringify(expectedFiles) !== JSON.stringify(copiedFiles)) throw Error(message);
    for (const name of expectedFiles) {
      const expected = fs.readFileSync(path.join(testRoot, 'e2e', name), 'utf8').replaceAll('localhost:3000', `localhost:${testPort}`);
      if (expected !== fs.readFileSync(path.join(testAppDir, 'legacy-e2e', name), 'utf8')) throw Error(message);
    }
  } catch { throw Error(message); }
}
exports.sourceFingerprint = sourceFingerprint;
exports.assertFreshTestBuild = assertFreshTestBuild;
