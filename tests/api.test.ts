import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import * as workers from '../src/app/api/workers/route';
import * as expenses from '../src/app/api/expenses/route';
import * as items from '../src/app/api/operation-items/route';

const request = (path: string, method = 'GET', body?: unknown) => new NextRequest(`http://localhost/api/${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}) });

describe('worker request handlers', () => {
  it('creates and lists a worker', async () => {
    const response = await workers.POST(request('workers', 'POST', { name: 'A', dailyWageRate: 800 }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ name: 'A', dailyWageRate: 800 });
    expect(await (await workers.GET(request('workers?activeOnly=true'))).json()).toHaveLength(1);
  });
  it.each([{ name: '', dailyWageRate: 800 }, { name: 'A', dailyWageRate: -1 }])('rejects invalid worker %j', async (body) => {
    expect((await workers.POST(request('workers', 'POST', body))).status).toBe(400);
  });
  it('rejects malformed JSON', async () => {
    expect((await workers.POST(new Request('http://localhost/api/workers', { method: 'POST', body: '{' }))).status).toBe(400);
  });
});

describe('expense request handlers', () => {
  it('creates, updates, summarizes and deletes an expense', async () => {
    const created = await expenses.POST(request('expenses', 'POST', { category: 'GENERAL', amount: 100, date: '2026-11-15', description: 'Tools' }));
    expect(created.status).toBe(201);
    const { data } = await created.json();
    expect((await expenses.PUT(request('expenses', 'PUT', { id: data.id, amount: 200 }))).status).toBe(200);
    const summary = await (await expenses.GET(request('expenses?summary=true'))).json();
    expect(summary.data.totalExpenses).toBe(200);
    expect((await expenses.DELETE(request(`expenses?id=${data.id}`, 'DELETE'))).status).toBe(200);
  });
  it.each([{}, { amount: -1, date: '2026-11-15', description: 'Tools' }, { amount: 1, date: '', description: 'Tools' }, { amount: 1, date: '2026-11-15', description: ' ' }])('rejects invalid expense %j', async (body) => {
    expect((await expenses.POST(request('expenses', 'POST', body))).status).toBe(400);
  });
  it('returns 400 for missing IDs and 404 for absent records', async () => {
    expect((await expenses.PUT(request('expenses', 'PUT', {}))).status).toBe(400);
    expect((await expenses.DELETE(request('expenses', 'DELETE'))).status).toBe(400);
    expect((await expenses.PUT(request('expenses', 'PUT', { id: 'missing' }))).status).toBe(404);
    expect((await expenses.DELETE(request('expenses?id=missing', 'DELETE'))).status).toBe(404);
  });
});

describe('operation-item request handlers', () => {
  it.each(['', ' '])('rejects blank name %j', async (name) => expect((await items.POST(request('operation-items', 'POST', { name }))).status).toBe(400));
  it('creates a catalog item and exposes search, code and uniqueness endpoints', async () => {
    const response = await items.POST(request('operation-items', 'POST', { name: 'Urea', category: 'Fertilizer & Nutrition' }));
    expect(response.status).toBe(201);
    const listing = await (await items.GET(request('operation-items?search=urea'))).json();
    expect(listing.items).toHaveLength(1);
    const code = await (await items.GET(request('operation-items?nextCodeFor=Fertilizer%20%26%20Nutrition'))).json();
    expect(code.nextCode).toBe('FERT-002');
    const unique = await (await items.GET(request('operation-items?checkUnique=fert-001'))).json();
    expect(unique.isUnique).toBe(false);
  });
  it('rejects code assignment without required fields', async () => expect((await items.POST(request('operation-items', 'POST', { action: 'assign_code' }))).status).toBe(400));
});
