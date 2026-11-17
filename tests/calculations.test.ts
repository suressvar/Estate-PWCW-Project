import { describe, expect, it } from 'vitest';
import { calculateWageForAttendance } from '../src/lib/worker-data';
import { computeDailyLogStatus, formatDateKey, getNextDayKey } from '../src/lib/daily-log-data';
import { calculateGodownItemStatus } from '../src/lib/godown-data';
import { cn } from '../src/lib/utils';
import { defaultAdminPermissions, defaultFieldStaffPermissions } from '../src/lib/rbac';
import type { WorkActivityItem } from '../src/lib/db-storage';

describe('wage calculation', () => {
  it.each([
    ['PRESENT', undefined, undefined, 8, 800],
    ['HALF_DAY', undefined, undefined, 4, 400],
    ['ABSENT', 8, 900, 0, 0], ['LEAVE', 8, 900, 0, 0],
    ['PRESENT', 10, undefined, 10, 1000], ['PRESENT', 0, undefined, 0, 0],
    ['HALF_DAY', 3, undefined, 3, 300], ['PRESENT', -1, undefined, 8, 800],
    ['PRESENT', 8, 0, 8, 0], ['HALF_DAY', undefined, 750, 4, 750],
  ] as const)('%s, hours=%s, override=%s', (status, hours, override, expectedHours, amount) => {
    expect(calculateWageForAttendance(800, status, hours, override)).toEqual({ hoursWorked: expectedHours, computedAmount: amount });
  });
  it('rounds partial wages to two decimals', () => {
    expect(calculateWageForAttendance(333, 'PRESENT', 1).computedAmount).toBe(41.63);
  });
});

describe('daily-work and calendar helpers', () => {
  it.each([
    [[], 'PLANNED'], [[[true, false]], 'COMPLETED'],
    [[[false, true]], 'PLANNED'], [[[false, false]], 'NOT_DONE'],
    [[[true, false], [false, true]], 'IN_PROGRESS'],
    [[[false, false], [false, true]], 'PLANNED'],
  ])('computes status for %j', (flags, status) => {
    const activities = (flags as boolean[][]).map(([completedFlag, plannedFlag]) => ({ completedFlag, plannedFlag })) as WorkActivityItem[];
    expect(computeDailyLogStatus(activities)).toBe(status);
  });
  it.each([
    ['2026-12-31', '2027-01-01'], ['2024-02-28', '2024-02-29'],
    ['2024-02-29', '2024-03-01'], ['2026-02-28', '2026-03-01'],
    ['2026-04-30', '2026-05-01'],
  ])('advances %s to %s', (date, next) => expect(getNextDayKey(date)).toBe(next));
  it('formats local dates with padding', () => expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05'));
});

describe('stock boundaries, styles and permissions', () => {
  it.each([[-1, 'EXHAUSTED'], [0, 'EXHAUSTED'], [1, 'LOW_STOCK'], [5, 'LOW_STOCK'], [6, 'IN_STOCK']])('stock %s is %s', (stock, status) => {
    expect(calculateGodownItemStatus(Number(stock), 5)).toBe(status);
  });
  it('merges conditional and conflicting utility classes', () => expect(cn('p-2', false, { 'text-sm': true }, 'p-4')).toBe('text-sm p-4'));
  it('gives administrators plot/crop management', () => expect(defaultAdminPermissions).toMatchObject({ canManagePlots: true, canManageCrops: true }));
  it('restricts field-staff plot/crop management', () => expect(defaultFieldStaffPermissions).toMatchObject({ canManagePlots: false, canManageCrops: false }));
});
