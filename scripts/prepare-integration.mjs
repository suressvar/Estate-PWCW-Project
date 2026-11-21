import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { testAppDir, testPort, assertTestServerStopped } from './test-paths.cjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = testAppDir;
await assertTestServerStopped();
if (fs.existsSync(target) && !fs.existsSync(path.join(target, '.isolated-test-copy'))) {
  throw new Error('Refusing to overwrite a directory not created by this test harness');
}
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, '.isolated-test-copy'), 'Disposable test copy. No estate records or environment secrets are copied.\n');
// Start each prepared copy from fresh synthetic data, including after interrupted runs.
// The directory marker above prevents this cleanup from targeting working records.
for (const name of ['estate-storage.json', 'estate-storage.json.bak']) {
  const file = path.join(target, 'data', name);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
function clearGeneratedFolder(name) {
  const base = path.resolve(target);
  const destination = path.resolve(base, name);
  if (!['src', 'public', 'legacy-e2e'].includes(name) || base === path.resolve(root) || path.dirname(destination) !== base || fs.realpathSync(base) !== base) throw new Error('Unsafe disposable-copy cleanup path.');
  if (fs.existsSync(destination)) {
    if (fs.lstatSync(destination).isSymbolicLink() || fs.realpathSync(destination) !== destination) throw new Error('Refusing to clear a linked test folder.');
    fs.rmSync(destination, { recursive: true, force: true });
  }
}
for (const folder of ['src', 'public']) {
  clearGeneratedFolder(folder);
  fs.cpSync(path.join(root, folder), path.join(target, folder), { recursive: true });
}
for (const file of ['package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']) fs.copyFileSync(path.join(root, file), path.join(target, file));
// Node resolves installed dependencies from the parent workspace; no symlink is needed.
const legacy = path.join(target, 'legacy-e2e');
clearGeneratedFolder('legacy-e2e');
fs.mkdirSync(legacy, { recursive: true });
for (const file of fs.readdirSync(path.join(root, 'e2e'))) {
  if (!file.endsWith('.ts')) continue;
  const original = fs.readFileSync(path.join(root, 'e2e', file), 'utf8');
  fs.writeFileSync(path.join(legacy, file), original.replaceAll('localhost:3000', `localhost:${testPort}`));
}
fs.writeFileSync(path.join(target, 'source-manifest.json'), JSON.stringify({
  createdAt: new Date().toISOString(),
  originalDataSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'data/estate-storage.json'))).digest('hex'),
  originalDataCopied: false,
}, null, 2));
console.log(`Prepared isolated application and redirected existing tests to port ${testPort}.`);
