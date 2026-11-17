import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
if (!path.basename(process.cwd()).startsWith('estate-storage-verification-') || !fs.existsSync('.test-only')) throw new Error('Storage verification requires a marked disposable directory.');
const storage = await import(pathToFileURL(process.argv[2]).href);
const mode = process.argv[3];
if (mode === 'init') {
  storage.resetAllData();
  storage.withTransaction(() => {
    const db = storage.getDatabase();
    db.plots.push({ id: 'recovery', name: 'Recovery Plot', location: 'Test', status: 'ACTIVE', areaAcres: 1, createdAt: '2026-11-16' });
    storage.saveDatabase(db);
  });
} else if (mode === 'increment') {
  for (let index = 0; index < 40; index++) storage.withTransaction(() => {
    const db = storage.getDatabase(); db.plots[0].areaAcres++; storage.saveDatabase(db);
  });
} else if (mode === 'rollback') {
  try { storage.withTransaction(() => { const db = storage.getDatabase(); db.plots[0].name = 'Uncommitted'; storage.saveDatabase(db); throw new Error('Rejected'); }); } catch (error) { if (error.message !== 'Rejected') throw error; }
} else if (mode === 'reset') storage.resetAllData();
console.log(JSON.stringify(storage.getDatabase().plots));
