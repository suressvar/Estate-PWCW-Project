// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MasterDailySheet } from '../src/components/daily-log/master-daily-sheet';
import { POST as dispatchSheet } from '../src/app/api/daily-log/master-sheet/route';
import { getDatabase } from '../src/lib/db-storage';
import { requestApi } from './helpers/api';
import { seedRecords } from './helpers/seed';

beforeEach(() => {
  vi.stubGlobal('React', React);
  vi.stubGlobal('fetch', vi.fn((input: string, init?: RequestInit) => {
    // The generic test dispatcher can match /daily-log/[id] before /master-sheet.
    if (input === '/api/daily-log/master-sheet') return dispatchSheet(new Request(`http://localhost${input}`, init));
    return requestApi(input, init?.method || 'GET', typeof init?.body === 'string' ? JSON.parse(init.body) : undefined);
  }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

async function openSheet() {
  const records = seedRecords();
  const onSuccess = vi.fn();
  const view = render(<MasterDailySheet
    selectedDate={records.date} selectedPlotId={records.plot.id}
    plots={[records.plot]} employees={[records.employee]}
    onDateChange={vi.fn()} onPlotChange={vi.fn()} onSuccess={onSuccess}
  />);
  const input = (id: string) => view.container.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)!;
  const change = (id: string, value: string) => fireEvent.change(input(id), { target: { value } });
  await waitFor(() => expect(input('master-sheet-crop').value).toBe(records.association!.id));
  return { records, onSuccess, input, change };
}

describe('master daily sheet across extracted sections', () => {
  it('keeps fuel estimates synchronized when either hours or machine changes', async () => {
    const { input, change } = await openSheet();
    change('master-machine-select', 'John Deere Tractor');
    change('master-machine-hours', '2');
    expect(input('master-diesel-liters').value).toBe('9');
    change('master-machine-select', 'VST Tillers');
    expect(input('master-diesel-liters').value).toBe('4');
    change('master-machine-hours', '3.5');
    expect(input('master-diesel-liters').value).toBe('7');
  });

  it('dispatches labor, machinery, and purchase entries together and resets unsaved fields', async () => {
    const { records, onSuccess, input, change } = await openSheet();
    change('master-men-count', '2');
    change('master-women-count', '1');
    change('master-working-hours', '4');
    change('master-machine-select', 'John Deere Tractor');
    change('master-machine-hours', '2');
    change('master-purchase-desc', 'Irrigation connectors');
    change('master-purchase-cost', '250');
    fireEvent.click(screen.getByRole('button', { name: 'Save & Dispatch to All Menus' }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    const db = getDatabase();
    expect(db.laborLogs[0]).toMatchObject({ menCount: 2, womenCount: 1, workingHours: 4, totalCost: 850 });
    expect(db.dieselLogs[0]).toMatchObject({ quantityLiters: 9, cost: 855 });
    expect(db.machineryLogs[0]).toMatchObject({ machineName: 'John Deere Tractor', runningHours: 2, dieselConsumedLiters: 9 });
    expect(db.generalPurchaseLogs[0]).toMatchObject({ description: 'Irrigation connectors', cost: 250 });
    expect(db.dailyLogs![0]).toMatchObject({ plotId: records.plot.id, date: records.date });
    expect(screen.getByText('Daily Sheet Successfully Dispatched!')).toBeDefined();
    fireEvent.click(screen.getByTitle('Clear and reset sheet fields'));
    expect(input('master-men-count').value).toBe('');
    expect(input('master-machine-hours').value).toBe('');
    expect(input('master-purchase-desc').value).toBe('');
    expect(screen.queryByText('Daily Sheet Successfully Dispatched!')).toBeNull();
    expect(db.generalPurchaseLogs).toHaveLength(1);
  });

  it('retains entered values when dispatch is rejected', async () => {
    const { onSuccess, input, change } = await openSheet();
    change('master-purchase-desc', 'Keep this purchase');
    change('master-purchase-cost', '250');
    vi.mocked(fetch).mockImplementation(async (url, init) =>
      init?.method === 'POST'
        ? Response.json({ error: 'Dispatch rejected for verification' }, { status: 400 })
        : requestApi(String(url)));
    fireEvent.click(screen.getByRole('button', { name: 'Save & Dispatch to All Menus' }));
    await screen.findByText('Dispatch rejected for verification');
    expect(input('master-purchase-desc').value).toBe('Keep this purchase');
    expect(input('master-purchase-cost').value).toBe('250');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(getDatabase().generalPurchaseLogs).toEqual([]);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Save & Dispatch to All Menus' }).disabled).toBe(false);
  });
});
