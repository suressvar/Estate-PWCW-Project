import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const runFile = promisify(execFile);
const root = process.cwd();
let directory: string;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'estate-storage-verification-'));
  fs.writeFileSync(path.join(directory, '.test-only'), 'Disposable test records only.');
});
afterEach(() => {
  const resolved = path.resolve(directory);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith('estate-storage-verification-') || !fs.existsSync(path.join(resolved, '.test-only'))) throw new Error('Unsafe test cleanup target.');
  fs.rmSync(resolved, { recursive: true, force: true, maxRetries: 5, retryDelay: 20 });
});
const run = (mode: string) => runFile(process.execPath, ['--experimental-strip-types', path.join(root, 'tests/helpers/storage-child.mjs'), path.join(root, 'src/lib/db-storage.ts'), mode], { cwd: directory, timeout: 15000 });
const dataPath = () => path.join(directory, 'data', 'estate-storage.json');
describe('real disk recovery and separate writer processes', () => {
  it('recovers the exact pre-reset estate records from a real dated backup after restart', async () => {
    await run('init'); const original = fs.readFileSync(dataPath(), 'utf8');
    await run('rollback'); expect(fs.readFileSync(dataPath(), 'utf8')).toBe(original);
    await run('reset'); expect(JSON.parse(fs.readFileSync(dataPath(), 'utf8')).plots).toEqual([]);
    const backupDir = path.join(directory, 'data', 'backups');
    const backup = fs.readdirSync(backupDir).find(name => JSON.parse(fs.readFileSync(path.join(backupDir, name), 'utf8')).plots.some((plot: { id: string }) => plot.id === 'recovery'));
    expect(backup).toBeTruthy();
    fs.copyFileSync(path.join(backupDir, backup!), dataPath());
    expect(JSON.parse((await run('read')).stdout)).toEqual(JSON.parse(original).plots);
    expect(fs.existsSync(path.join(directory, 'data', 'estate-storage.lock'))).toBe(false);
  }, 30000);
  it('serializes 120 writes from three independent processes without lost updates', async () => {
    await run('init');
    const results = await Promise.allSettled([run('increment'), run('increment'), run('increment')]);
    for (const result of results) if (result.status === 'rejected') throw result.reason;
    expect(JSON.parse(fs.readFileSync(dataPath(), 'utf8')).plots[0].areaAcres).toBe(121);
    expect(JSON.parse(fs.readFileSync(`${dataPath()}.bak`, 'utf8')).plots[0].areaAcres).toBe(120);
    expect(fs.existsSync(path.join(directory, 'data', 'estate-storage.lock'))).toBe(false);
  }, 30000);
  it('refuses a retained writer lock and preserves the original file', async () => {
    await run('init'); const original = fs.readFileSync(dataPath(), 'utf8');
    fs.writeFileSync(path.join(directory, 'data', 'estate-storage.lock'), '');
    await expect(run('increment')).rejects.toThrow(/busy/);
    expect(fs.readFileSync(dataPath(), 'utf8')).toBe(original);
  }, 30000);
  it('preserves corrupt bytes and the valid backup during startup failure', async () => {
    await run('init'); const backup = fs.readFileSync(`${dataPath()}.bak`, 'utf8');
    fs.writeFileSync(dataPath(), '{corrupt');
    await expect(run('read')).rejects.toThrow(/unreadable/);
    expect(fs.readFileSync(dataPath(), 'utf8')).toBe('{corrupt');
    expect(fs.readFileSync(`${dataPath()}.bak`, 'utf8')).toBe(backup);
  }, 30000);
});
