import type { EstateDatabase } from './db-storage';
/** Persist the high-water mark with its transaction, even when older records are deleted. */
export function nextReference(db: EstateDatabase, prefix: string, existing: readonly unknown[], width = 3): string {
  const counters = db.referenceCounters ||= {};
  let highest = Number.isSafeInteger(counters[prefix]) ? Math.max(0, counters[prefix]) : 0;
  for (const value of existing) {
    if (typeof value !== 'string' || !value.startsWith(prefix)) continue;
    const suffix = value.slice(prefix.length);
    if (/^\d+$/.test(suffix)) highest = Math.max(highest, Number(suffix));
  }
  if (!Number.isSafeInteger(highest + 1)) throw new Error('Reference number range exhausted.');
  counters[prefix] = highest + 1;
  return `${prefix}${String(highest + 1).padStart(width, '0')}`;
}
export function formatInvoiceReference(id: string): string {
  return `INV-OTH-${id.startsWith('inv_') ? id.slice(4) : id}`;
}
