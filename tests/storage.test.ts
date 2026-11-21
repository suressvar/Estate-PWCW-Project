import { beforeEach, describe, expect, it, vi } from 'vitest';

const disk = vi.hoisted(() => ({ raw: '', exists: true, mtime: 1, failWrite: false, failRename: false, lockFailures: 0, lockOpenFailures: 0, lockReleaseFailures: 0, renameAttempts: 0, temporary: '', backup: '', writes: 0 }));
vi.mock('node:fs', () => ({ default: {
  existsSync: (file: string) => file.endsWith('.json') ? disk.exists : file.endsWith('.bak') ? Boolean(disk.backup) : true,
  readFileSync: () => disk.raw,
  statSync: () => ({ mtimeMs: disk.mtime }),
  mkdirSync: vi.fn(),
  openSync: () => { if (disk.lockOpenFailures-- > 0) throw Object.assign(new Error('Temporary Windows lock'), { code: 'EPERM' }); return 1; },
  closeSync: vi.fn(),
  unlinkSync: () => { if (disk.lockReleaseFailures-- > 0) throw Object.assign(new Error('Temporary Windows lock'), { code: 'EPERM' }); },
  writeFileSync: (_file: string, value: string) => {
    if (disk.failWrite) throw new Error('Disk full');
    disk.temporary = value; disk.writes++;
  },
  copyFileSync: () => { disk.backup = disk.raw; },
  renameSync: () => {
    disk.renameAttempts++;
    if (disk.lockFailures-- > 0) throw Object.assign(new Error('Temporarily locked'), { code: 'EPERM' });
    if (disk.failRename) throw new Error('Rename failed');
    disk.raw = disk.temporary; disk.mtime++; disk.exists = true;
  },
} }));
const load = () => vi.importActual<typeof import('../src/lib/db-storage')>('../src/lib/db-storage');
beforeEach(() => {
  vi.resetModules(); disk.raw = '{}'; disk.exists = true; disk.mtime = 1; disk.failWrite = false; disk.failRename = false; disk.lockFailures = 0; disk.lockOpenFailures = 0; disk.lockReleaseFailures = 0; disk.renameAttempts = 0; disk.temporary = ''; disk.backup = ''; disk.writes = 0;
});

describe('storage (virtual filesystem only)', () => {
  it('retries transient Windows lock acquisition and release failures', async () => {
    const storage = await load(); disk.lockOpenFailures = 2; disk.lockReleaseFailures = 2;
    storage.withTransaction(() => { const db = storage.getDatabase(); db.plots.push({ id: 'retry' } as never); storage.saveDatabase(db); });
    expect(JSON.parse(disk.raw).plots[0].id).toBe('retry');
    expect(disk.writes).toBe(1);
  });
  it('does not resurrect deleted equipment when an empty machine collection is loaded', async () => {
    disk.raw = '{"machines":[]}'; expect((await load()).getDatabase().machines).toEqual([]);
  });
  it('fails closed if an already loaded storage file disappears', async () => {
    const storage = await load(); storage.getDatabase(); disk.exists = false;
    expect(() => storage.getDatabase()).toThrow(/missing/); expect(disk.writes).toBe(0);
  });
  it('does not commit a nested operation that failed even if the outer callback catches it', async () => {
    const storage = await load(); const original = disk.raw;
    expect(() => storage.withTransaction(() => {
      try { storage.withTransaction(() => { const db = storage.getDatabase(); db.plots.push({ id: 'partial' } as never); storage.saveDatabase(db); throw new Error('Rejected'); }); } catch { /* outer work cannot swallow an aborted transaction */ }
    })).toThrow(/aborted/);
    expect(disk.raw).toBe(original); expect(disk.writes).toBe(0);
  });
  it('rejects asynchronous callbacks before they can start changing records', async () => {
    const storage = await load(); let started = false;
    expect(() => storage.withTransaction(async () => { started = true; })).toThrow(/synchronous/);
    expect(started).toBe(false);
  });
  it('fills missing collections and default categories for older records', async () => {
    disk.raw = JSON.stringify({ crops: [{ type: 'CUSTOM' }], ledgerGroups: [{ groupType: 'CUSTOM' }] });
    const db = (await load()).getDatabase();
    expect(db.plots).toEqual([]); expect(db.wages).toEqual([]);
    expect(db.cropCategories).toContain('CUSTOM'); expect(db.groupTypes).toContain('CUSTOM');
    expect(db.expenseUnits.length).toBeGreaterThan(0);
  });
  it('returns cache for unchanged files and reloads newer files', async () => {
    const storage = await load(); const first = storage.getDatabase();
    expect(storage.getDatabase()).toBe(first);
    disk.raw = JSON.stringify({ plots: [{ id: 'changed' }] }); disk.mtime++;
    expect(storage.getDatabase().plots[0].id).toBe('changed');
  });
  it('persists changes to virtual disk', async () => {
    const storage = await load(); const db = storage.getDatabase();
    db.plots = []; storage.saveDatabase(db);
    expect(JSON.parse(disk.raw).plots).toEqual([]); expect(disk.writes).toBe(1);
  });
  it('resets all records to empty state', async () => {
    const storage = await load(); const db = storage.resetAllData();
    expect(db.plots).toEqual([]); expect(db.employees).toEqual([]);
    expect(JSON.parse(disk.raw).plots).toEqual([]);
  });
  it('initializes seed data for absent storage', async () => {
    disk.exists = false; const storage = await load();
    expect(storage.getDatabase().plots.length).toBeGreaterThan(0); expect(disk.writes).toBe(1);
  });
  it('preserves malformed storage and fails closed instead of overwriting records', async () => {
    disk.raw = '{'; const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { const storage = await load(); expect(() => storage.getDatabase()).toThrow(/preserved/); expect(disk.raw).toBe('{'); expect(disk.writes).toBe(0); expect(log).toHaveBeenCalled(); }
    finally { log.mockRestore(); }
  });
  it.each(['', 'null', '[]', '"text"', '{"employees":{}}'])('preserves invalid storage shape %j', async raw => {
    disk.raw = raw;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { const storage = await load(); expect(() => storage.getDatabase()).toThrow(); expect(disk.raw).toBe(raw); expect(disk.writes).toBe(0); }
    finally { log.mockRestore(); }
  });
  it('reports write failure and reloads the last committed records', async () => {
    const storage = await load(); const db = storage.getDatabase(); disk.failWrite = true;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try { db.plots.push({ id: 'unsaved' } as never); expect(() => storage.saveDatabase(db)).toThrow(/No changes were committed/); expect(storage.getDatabase().plots).toEqual([]); expect(log).toHaveBeenCalled(); }
    finally { log.mockRestore(); }
  });
  it('retains committed data and a backup when atomic replacement fails', async () => {
    const storage = await load(); const db = storage.getDatabase(); const original = disk.raw;
    disk.failRename = true;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => storage.saveDatabase(db)).toThrow();
      expect(disk.raw).toBe(original); expect(disk.backup).toBe(original);
    } finally { log.mockRestore(); }
  });
  it('retries a temporary Windows lock and commits without rewriting the temporary file', async () => {
    const storage = await load(); const db = storage.getDatabase(); disk.lockFailures = 2;
    db.plots.push({ id: 'retry-saved' } as never); storage.saveDatabase(db);
    expect(disk.renameAttempts).toBe(3); expect(disk.writes).toBe(1);
    expect(JSON.parse(disk.raw).plots[0].id).toBe('retry-saved');
  });
  it('bounds retries and preserves committed records when a Windows lock persists', async () => {
    const storage = await load(); const db = storage.getDatabase(); const original = disk.raw;
    disk.lockFailures = 100;
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => storage.saveDatabase(db)).toThrow(/No changes were committed/);
      expect(disk.renameAttempts).toBe(6); expect(disk.raw).toBe(original); expect(disk.backup).toBe(original);
    } finally { log.mockRestore(); }
  });
  it('commits a multi-step transaction once', async () => {
    const storage = await load();
    storage.withTransaction(() => {
      const db = storage.getDatabase();
      db.plots.push({ id: 'transaction' } as never); storage.saveDatabase(db);
      db.employees.push({ id: 'employee' } as never); storage.saveDatabase(db);
      expect(disk.writes).toBe(0);
    });
    expect(disk.writes).toBe(1);
    expect(JSON.parse(disk.raw).plots[0].id).toBe('transaction');
    expect(JSON.parse(disk.raw).employees[0].id).toBe('employee');
  });
  it('rolls back every step if a later operation rejects the transaction', async () => {
    const storage = await load(); const original = disk.raw;
    expect(() => storage.withTransaction(() => {
      const db = storage.getDatabase(); db.plots.push({ id: 'uncommitted' } as never);
      storage.saveDatabase(db); throw new Error('Later validation failed');
    })).toThrow('Later validation failed');
    expect(disk.writes).toBe(0); expect(disk.raw).toBe(original);
    expect(storage.getDatabase().plots).toEqual([]);
  });

});
