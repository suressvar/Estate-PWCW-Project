import { afterEach, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assertIsolatedStorage } from '../e2e/storage-safety';
let temporaryRoot: string | undefined;
afterEach(() => {
  if (!temporaryRoot) return;
  const absolute = path.resolve(temporaryRoot);
  if (path.dirname(absolute) !== path.resolve(os.tmpdir()) || !path.basename(absolute).startsWith('estate-harness-')) throw new Error('Unsafe test cleanup path.');
  fs.rmSync(absolute, { recursive: true, force: true });
  temporaryRoot = undefined;
});
it('refuses legacy storage tests from the real workspace', () => {
  expect(() => assertIsolatedStorage(process.cwd(), process.cwd())).toThrow(/isolated/);
});
it('requires both an allowed test-copy path and its disposable marker', () => {
  temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'estate-harness-'));
  const isolated = path.join(temporaryRoot, '.black-box-app');
  fs.mkdirSync(isolated);
  expect(() => assertIsolatedStorage(isolated, temporaryRoot!)).toThrow(/isolated/);
  fs.writeFileSync(path.join(isolated, '.isolated-test-copy'), 'Synthetic test directory');
  expect(() => assertIsolatedStorage(isolated, temporaryRoot!)).not.toThrow();
});
