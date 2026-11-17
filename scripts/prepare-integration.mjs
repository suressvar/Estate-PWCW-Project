import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, '.integration-app');
if (fs.existsSync(target) && !fs.existsSync(path.join(target, '.isolated-test-copy'))) {
  throw new Error('Refusing to overwrite a directory not created by this test harness');
}
fs.mkdirSync(target, { recursive: true });
fs.writeFileSync(path.join(target, '.isolated-test-copy'), 'Disposable test copy. No estate records or environment secrets are copied.\n');
for (const folder of ['src', 'public']) fs.cpSync(path.join(root, folder), path.join(target, folder), { recursive: true });
for (const file of ['package.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']) fs.copyFileSync(path.join(root, file), path.join(target, file));
// Node resolves installed dependencies from the parent workspace; no symlink is needed.
const legacy = path.join(target, 'legacy-e2e');
fs.mkdirSync(legacy, { recursive: true });
for (const file of fs.readdirSync(path.join(root, 'e2e'))) {
  if (!file.endsWith('.ts')) continue;
  const original = fs.readFileSync(path.join(root, 'e2e', file), 'utf8');
  fs.writeFileSync(path.join(legacy, file), original.replaceAll('localhost:3000', 'localhost:3107'));
}
fs.writeFileSync(path.join(target, 'source-manifest.json'), JSON.stringify({
  createdAt: new Date().toISOString(),
  originalDataSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'data/estate-storage.json'))).digest('hex'),
  originalDataCopied: false,
}, null, 2));
console.log('Prepared isolated application and redirected existing tests to port 3107.');
