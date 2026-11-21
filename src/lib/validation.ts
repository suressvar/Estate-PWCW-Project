export class ValidationError extends Error {}
import type { CropCycleItem, EstateDatabase } from './db-storage';
export function assertRecordId(id: string, changes: { id?: unknown }) {
  if (changes.id !== undefined && changes.id !== id) throw new ValidationError('Record ID cannot be changed.');
}
export function requiredText(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new ValidationError(`${label} is required.`);
  return value.trim();
}
export function finiteNumber(value: unknown, label: string, minimum = 0, fallback?: number): number {
  if (value === undefined && fallback !== undefined) value = fallback;
  if ((typeof value !== 'number' && typeof value !== 'string') || value === '' || (typeof value === 'string' && !value.trim())) throw new ValidationError(`${label} must be a valid number.`);
  const result = Number(value);
  if (!Number.isFinite(result) || result < minimum || result > Number.MAX_SAFE_INTEGER) throw new ValidationError(`${label} must be at least ${minimum} and within the supported numeric range.`);
  return result;
}
export function positiveNumber(value: unknown, label: string): number {
  const result = finiteNumber(value, label);
  if (result <= 0) throw new ValidationError(`${label} must be greater than zero.`);
  return result;
}
export function dateKey(value: unknown, label = 'Date'): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new ValidationError(`${label} must use YYYY-MM-DD.`);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new ValidationError(`${label} is invalid.`);
  return value;
}
export function oneOf<T extends string>(value: unknown, choices: readonly T[], label: string, fallback?: T): T {
  if (value === undefined && fallback !== undefined) return fallback;
  if (typeof value !== 'string' || !choices.includes(value as T)) throw new ValidationError(`${label} is invalid.`);
  return value as T;
}
export function dateRange(from: string, to: string) {
  dateKey(from, 'Start date'); dateKey(to, 'End date');
  if (from > to) throw new ValidationError('End date cannot precede start date.');
}
export function referenceExists(id: unknown, records: readonly { id: string }[], label: string) {
  if (typeof id !== 'string' || !records.some(record => record.id === id)) throw new ValidationError(`${label} not found.`);
}
type Allocation = { plotId?: string | null; cropCycleId?: string | null };
export function validateAllocation(data: Allocation, db: EstateDatabase): CropCycleItem | undefined;
export function validateAllocation(db: EstateDatabase, plotId?: string | null, cycleId?: string | null): CropCycleItem | undefined;
export function validateAllocation(dataOrDb: Allocation | EstateDatabase, dbOrPlotId?: EstateDatabase | string | null, cycleId?: string | null) {
  const positional = 'plots' in dataOrDb;
  const db = positional ? dataOrDb : dbOrPlotId as EstateDatabase;
  const plotId = positional ? dbOrPlotId as string | null | undefined : dataOrDb.plotId;
  const cropCycleId = positional ? cycleId : dataOrDb.cropCycleId;
  if (plotId) referenceExists(plotId, db.plots, 'Plot');
  const cycle = cropCycleId ? (db.cropCycles || []).find(item => item.id === cropCycleId) : undefined;
  if (cropCycleId && !cycle) throw new ValidationError('Crop cycle not found.');
  if (plotId && cycle && cycle.plotId !== plotId) {
    throw new ValidationError(positional ? 'Crop cycle belongs to a different plot.' : 'Crop cycle does not belong to the selected plot.');
  }
  return cycle;
}
