import fs from 'node:fs';
import path from 'node:path';
export function assertIsolatedStorage(directory: string, workspace: string) {
  const allowed = ['.integration-app', '.black-box-app'].map(name => path.resolve(workspace, name));
  if (!allowed.includes(path.resolve(directory)) || !fs.existsSync(path.join(directory, '.isolated-test-copy'))) {
    throw new Error('Legacy storage tests require a marked isolated working directory. Use npm run test:e2e or npm run test:all; real estate records must never be used.');
  }
}
