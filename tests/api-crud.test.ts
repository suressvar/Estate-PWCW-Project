import { describe, expect, it } from 'vitest';
import { requestApi } from './helpers/api';
import { seedRecords } from './helpers/seed';
import { getDatabase } from '../src/lib/db-storage';

const resources = [
  { route: 'plots', body: { name: 'CRUD Plot', areaAcres: 3, status: 'ACTIVE' }, change: { name: 'Updated Plot' }, key: 'name', queryId: true },
  { route: 'crops', body: { name: 'CRUD Crop', type: 'CROP' }, change: { name: 'Updated Crop' }, key: 'name', queryId: true },
  { route: 'employees', body: { name: 'CRUD Employee', wageRate: 700, wageType: 'DAILY', status: 'ACTIVE' }, change: { name: 'Updated Employee' }, key: 'name' },
  { route: 'parties', body: { name: 'CRUD Supplier', type: 'Vendor' }, change: { name: 'Updated Supplier' }, key: 'name' },
  { route: 'ledger-groups', body: { groupName: 'CRUD Group', groupType: 'EXPENSE', pnlSide: 'DEBIT', description: 'Test' }, change: { groupName: 'Updated Group' }, key: 'groupName' },
  { route: 'stock-valuations', body: { periodName: 'Test Period', fromDate: '2026-01-01', toDate: '2026-12-31', openingStock: 100, closingStock: 200 }, change: { closingStock: 300 }, key: 'closingStock' },
  { route: 'machines', body: { name: 'CRUD Tractor', type: 'TRACTOR', active: true, fuelType: 'Diesel' }, change: { name: 'Updated Tractor' }, key: 'name' },
  { route: 'operation-items', body: { name: 'CRUD Supplies', category: 'General Estate Supplies', unit: 'kg', defaultRate: 10, currentStock: 5, minStockAlert: 0, status: 'ACTIVE' }, change: { name: 'Updated Supplies' }, key: 'name' },
  { route: 'sales/other', body: { buyerName: 'CRUD Buyer', items: [{ itemName: 'Tomato', quantity: 3, pricePerUnit: 10 }] }, change: { buyerName: 'Updated Buyer' }, key: 'buyerName', sale: true },
  ...['feed', 'medicine', 'vaccine', 'other'].map(type => ({ route: `vouchers/${type}`, body: { feedName: 'Feed', medicineName: 'Medicine', vaccineName: 'Vaccine', description: 'Supplies', quantity: 10, cost: 100, amount: 100, supplierName: 'CRUD Vendor' }, change: { supplierName: 'Updated Vendor' }, key: 'supplierName' })),
] as const;
function unwrap(value: Record<string, unknown>): Record<string, unknown> {
  return (value.data || value.item || value) as Record<string, unknown>;
}
describe('resource create, read, update and deletion through real handlers', () => {
  for (const resource of resources) {
    it(`${resource.route} preserves identity and persists a full CRUD lifecycle`, async () => {
      seedRecords();
      const creation = await requestApi(`/api/${resource.route}`, 'POST', resource.body);
      expect(creation.status, await creation.clone().text()).toBe(201);
      const raw = await creation.json();
      const record = 'sale' in resource ? raw.items[0] : unwrap(raw);
      const id = String(record.id);
      expect(id).not.toBe('undefined');
      const list = await requestApi(`/api/${resource.route}`);
      expect(await list.text()).toContain(id);
      const target = 'queryId' in resource ? `/api/${resource.route}?id=${id}` : `/api/${resource.route}/${id}`;
      const update = await requestApi(target, 'PUT', { ...record, ...resource.change });
      expect(update.status, await update.clone().text()).toBe(200);
      const updated = unwrap(await update.json());
      expect(updated.id).toBe(id);
      expect(updated[resource.key]).toBe(resource.change[resource.key as keyof typeof resource.change]);
      const deletion = await requestApi(target, 'DELETE');
      expect(deletion.status, await deletion.clone().text()).toBe(200);
      expect(await (await requestApi(`/api/${resource.route}`)).text()).not.toContain(id);
    });
  }
  it('never clears financial history through bulk stock deletion', async () => {
    seedRecords(); const original = structuredClone(getDatabase());
    expect((await requestApi('/api/godown/items', 'DELETE')).status).toBe(409);
    expect(getDatabase()).toEqual(original);
  });
  it('requires a specific sale ID instead of silently clearing all sales', async () => {
    seedRecords(); const original = structuredClone(getDatabase());
    expect((await requestApi('/api/sales/other', 'DELETE')).status).toBe(400);
    expect(getDatabase()).toEqual(original);
  });
  it.each(['crop-categories', 'purchase-categories', 'sales-categories', 'group-types'])('%s adds and removes a custom classification', async route => {
    const name = 'UNIQUE CLASSIFICATION';
    const response = await requestApi(`/api/${route}`, 'POST', { category: name, name, typeName: name, groupType: name });
    expect(response.status, await response.clone().text()).toBeLessThan(300);
    expect(await (await requestApi(`/api/${route}`)).text()).toContain(name);
    const deletion = await requestApi(`/api/${route}?category=${encodeURIComponent(name)}&name=${encodeURIComponent(name)}&type=${encodeURIComponent(name)}`, 'DELETE');
    expect(deletion.status, await deletion.clone().text()).toBeLessThan(300);
    expect(await (await requestApi(`/api/${route}`)).text()).not.toContain(name);
  });
});
