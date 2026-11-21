import { describe, expect, it, vi } from 'vitest';
import { requestApi } from './helpers/api';
import { seedRecords } from './helpers/seed';
import { getDatabase } from '../src/lib/db-storage';
import * as logs from '../src/lib/transaction-logs';

describe('WB atomic multi-section daily dispatch', () => {
  it('rolls back an earlier section if a later business operation fails', async () => {
    const records = seedRecords(); const original = structuredClone(getDatabase());
    const failure = vi.spyOn(logs, 'addGeneralPurchaseLog').mockImplementationOnce(() => { throw new Error('Injected late dispatch failure'); });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await requestApi('/api/daily-log/master-sheet', 'POST', { date: records.date, plotId: records.plot.id, labor: { menCount: 1 }, purchase: { description: 'Supplies', cost: 20 } });
      expect(response.status).toBe(500);
      expect(getDatabase()).toEqual(original);
    } finally { failure.mockRestore(); error.mockRestore(); }
  });
  it.each([{ labor: { menCount: -1 } }, { labor: { menCount: 1.5 } }, { labor: { workingHours: 25 } }, { purchase: { cost: 'bad' } }, { machinery: { dieselCost: -1 } }, { sales: { paymentStatus: 'INVALID' } }])('rejects invalid section %j before writing anything', async invalid => {
    const records = seedRecords(); const original = structuredClone(getDatabase());
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await requestApi('/api/daily-log/master-sheet', 'POST', { date: records.date, plotId: records.plot.id, ...invalid });
      expect(response.status).toBe(400); expect(getDatabase()).toEqual(original);
    } finally { error.mockRestore(); }
  });
  it('preserves explicitly zero labor rates and fuel costs', async () => {
    const records = seedRecords();
    const response = await requestApi('/api/daily-log/master-sheet', 'POST', { date: records.date, plotId: records.plot.id, labor: { menCount: 1, menWageRate: 0 }, machinery: { machineName: 'Tractor', runningHours: 1, dieselConsumedLiters: 2, dieselCost: 0 } });
    expect(response.status, await response.clone().text()).toBe(201);
    expect(getDatabase().laborLogs[0]).toMatchObject({ menWageRate: 0, totalCost: 0 });
    expect(getDatabase().dieselLogs[0].cost).toBe(0);
  });
});
