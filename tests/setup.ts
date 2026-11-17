import { beforeEach, vi } from 'vitest';
import type { EstateDatabase } from '../src/lib/db-storage';

// All business/handler tests use a fresh in-memory store. Never open estate data.
const state = vi.hoisted(() => ({ db: {} as EstateDatabase }));
vi.mock('../src/lib/db-storage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/db-storage')>();
  return { ...actual, getDatabase: () => state.db, saveDatabase: vi.fn(), withTransaction: <T>(work: () => T) => {
    const before = structuredClone(state.db);
    try { return work(); } catch (error) { state.db = before; throw error; }
  } };
});

beforeEach(() => {
  const arrays = [
    'plots', 'crops', 'plotCrops', 'fertilizerLogs', 'dieselLogs', 'machineryLogs',
    'laborLogs', 'productionLogs', 'salesLogs', 'generalPurchaseLogs',
    'employeeRoles', 'employees', 'attendance', 'wages', 'leaves', 'expenseUnits',
    'feedPurchases', 'medicinePurchases', 'vaccinePurchases', 'otherVouchers',
    'otherSales', 'feedInventory', 'medicineInventory', 'vaccineInventory',
    'stockValuations', 'ledgerGroups', 'expenseLedgers', 'godownItems',
    'godownMovements', 'parties', 'dailyLogs', 'cropCycles', 'cropExpenses',
    'cropIncomes', 'workers', 'workerAttendances', 'workerActivityLogs',
    'wageEntries', 'machines', 'machineUsageLogs', 'generalExpenses',
    'pettyCashLedger', 'operationItems', 'cropCategories', 'groupTypes',
    'purchaseCategories', 'salesCategories',
  ];
  state.db = Object.fromEntries(arrays.map(key => [key, []])) as unknown as EstateDatabase;
  vi.clearAllMocks();
});
