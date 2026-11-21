import { withTransaction } from "./db-storage";
import { calculateVoucherTotals } from './money';
import { nextReference } from './references';
import { requiredText, dateKey, finiteNumber, oneOf } from './validation';
import { randomUUID } from "node:crypto";
import { reversePurchaseStock } from "./stock-reconciliation";
import {
BaseLog,
DEFAULT_PURCHASE_CATEGORIES,
DieselLogItem,
FertilizerLogItem,
GeneralPurchaseLogItem,
getDatabase,
LaborLogItem,
MachineryLogItem,
ProductionLogItem,
PurchaseVoucherItem,
SalesLogItem,
saveDatabase,
VoucherLineItem,
} from "./db-storage";

export type {
BaseLog,DieselLogItem,FertilizerLogItem,GeneralPurchaseLogItem,LaborLogItem,MachineryLogItem,ProductionLogItem,PurchaseVoucherItem,SalesLogItem,VoucherLineItem
};

export { MACHINE_RATES } from "@/types/estate";

function validateLog(data: { date: string }, amounts: Record<string, unknown>) {
  dateKey(data.date);
  for (const [label, value] of Object.entries(amounts)) finiteNumber(value, label);
  const fields = data as unknown as Record<string, unknown>;
  for (const key of ['loggedBy', 'plotName', 'cropActivityName', 'notes', 'machineName', 'operatorName', 'fertilizerName', 'buyerName', 'description', 'vendorName', 'category']) {
    if (fields[key] != null && typeof fields[key] !== 'string') throw new Error(`${key} must be text.`);
  }
}

export function getFertilizerLogs(): FertilizerLogItem[] {
  return getDatabase().fertilizerLogs;
}

export function addFertilizerLog(data: Omit<FertilizerLogItem, "id" | "createdAt">): FertilizerLogItem {
  return withTransaction(() => {
  validateLog(data, { 'Fertilizer quantity': data.quantityKg, Cost: data.cost });
  oneOf(data.transactionType, ['PURCHASE', 'CONSUMPTION'], 'Transaction type');
  const db = getDatabase();
  const item: FertilizerLogItem = { ...data, id: `fert_${randomUUID()}`, createdAt: new Date().toISOString() };
  db.fertilizerLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function getDieselLogs(): DieselLogItem[] {
  return getDatabase().dieselLogs;
}

export function addDieselLog(data: Omit<DieselLogItem, "id" | "createdAt">): DieselLogItem {
  return withTransaction(() => {
  validateLog(data, { 'Diesel quantity': data.quantityLiters, Cost: data.cost });
  oneOf(data.transactionType, ['PURCHASE', 'CONSUMPTION'], 'Transaction type');
  const db = getDatabase();
  const item: DieselLogItem = { ...data, id: `diesel_${randomUUID()}`, createdAt: new Date().toISOString() };
  db.dieselLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function getMachineryLogs(): MachineryLogItem[] {
  return getDatabase().machineryLogs;
}

export function addMachineryLog(data: Omit<MachineryLogItem, "id" | "createdAt">): MachineryLogItem {
  return withTransaction(() => {
  validateLog(data, { 'Running hours': data.runningHours, 'Diesel consumed': data.dieselConsumedLiters });
  const db = getDatabase();
  const item: MachineryLogItem = { ...data, id: `mach_${randomUUID()}`, createdAt: new Date().toISOString() };
  db.machineryLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function getLaborLogs(): LaborLogItem[] {
  return getDatabase().laborLogs;
}

export function addLaborLog(data: Omit<LaborLogItem, "id" | "createdAt">): LaborLogItem {
  return withTransaction(() => {
  validateLog(data, { 'Men count': data.menCount ?? 0, 'Women count': data.womenCount ?? 0,
    'Men wage rate': data.menWageRate ?? 0, 'Women wage rate': data.womenWageRate ?? 0, 'Total cost': data.totalCost });
  if (!Number.isInteger(data.menCount ?? 0) || !Number.isInteger(data.womenCount ?? 0)) throw new Error('Worker counts must be whole numbers.');
  const db = getDatabase();
  const item: LaborLogItem = { ...data, id: `labor_${randomUUID()}`, createdAt: new Date().toISOString() };
  db.laborLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function getProductionLogs(): ProductionLogItem[] {
  return getDatabase().productionLogs;
}

export function addProductionLog(data: Omit<ProductionLogItem, "id" | "createdAt">): ProductionLogItem {
  return withTransaction(() => {
  validateLog(data, { 'Production quantity': data.quantityKg });
  const db = getDatabase();
  const item: ProductionLogItem = { ...data, id: `prod_${randomUUID()}`, createdAt: new Date().toISOString() };
  db.productionLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function getSalesLogs(): SalesLogItem[] {
  return getDatabase().salesLogs;
}

export function addSalesLog(data: Omit<SalesLogItem, "id" | "createdAt">): SalesLogItem {
  return withTransaction(() => {
  if (data.items?.length) {
    const totals = calculateVoucherTotals(data.items, data.taxPercent, data.discount);
    data = { ...data, ...totals, value: totals.total };
  }
  validateLog(data, { 'Sales quantity': data.quantityKg, 'Sales value': data.value });
  const db = getDatabase();
  const year = data.date?.slice(0, 4) || String(new Date().getFullYear());
  const voucherNo = data.voucherNo !== undefined && data.voucherNo !== '' ? requiredText(data.voucherNo, 'Voucher number') : nextReference(db, `SLS-VCH-${year}-`, db.salesLogs.map(item => item.voucherNo || ''));
  if (db.salesLogs.some(item => item.voucherNo === voucherNo)) throw new Error('Sales voucher reference already exists.');
  const item: SalesLogItem = {
    ...data,
    id: `sales_${randomUUID()}`,
    voucherNo,
    subtotal: data.subtotal ?? data.value,
    createdAt: new Date().toISOString(),
  };
  db.salesLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function deleteSalesLog(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  db.salesLogs = db.salesLogs.filter((s) => s.id !== id);
  saveDatabase(db);
  return true;

  });
}

export function getGeneralPurchaseLogs(): GeneralPurchaseLogItem[] {
  return getDatabase().generalPurchaseLogs;
}

export function addGeneralPurchaseLog(data: Omit<PurchaseVoucherItem, "id" | "createdAt" | "voucherNo"> & { voucherNo?: string }): GeneralPurchaseLogItem {
  return withTransaction(() => {
  if (data.items?.length) {
    const totals = calculateVoucherTotals(data.items, data.taxPercent, data.discount);
    data = { ...data, ...totals, cost: totals.total };
  }
  validateLog(data, { Cost: data.cost });
  const db = getDatabase();
  const year = data.date?.slice(0, 4) || String(new Date().getFullYear());
  const voucherNo = data.voucherNo !== undefined && data.voucherNo !== '' ? requiredText(data.voucherNo, 'Voucher number') : nextReference(db, `PUR-VCH-${year}-`, db.generalPurchaseLogs.map(item => item.voucherNo || ''));
  if (db.generalPurchaseLogs.some(item => item.voucherNo === voucherNo)) throw new Error('Purchase voucher reference already exists.');
  const item: PurchaseVoucherItem = {
    ...data,
    id: `gen_${randomUUID()}`,
    voucherNo,
    subtotal: data.subtotal ?? data.cost,
    createdAt: new Date().toISOString(),
  };
  db.generalPurchaseLogs.unshift(item);
  saveDatabase(db);
  return item;

  });
}

export function deleteGeneralPurchaseLog(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  reversePurchaseStock(db, id);
  db.generalPurchaseLogs = db.generalPurchaseLogs.filter((g) => g.id !== id);
  saveDatabase(db);
  return true;

  });
}

export function getPurchaseCategories(): string[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.purchaseCategories || !Array.isArray(db.purchaseCategories) || db.purchaseCategories.length === 0) {
    const existingVoucherCats = (db.generalPurchaseLogs || []).map((v) => v.category).filter(Boolean);
    db.purchaseCategories = Array.from(new Set([...DEFAULT_PURCHASE_CATEGORIES, ...existingVoucherCats]));
    saveDatabase(db);
  }
  return db.purchaseCategories;

  });
}

export function createPurchaseCategory(category: string): string {
  return withTransaction(() => {
  const db = getDatabase();
  const trimmed = category.trim();
  if (!trimmed) return "";
  if (!db.purchaseCategories) {
    db.purchaseCategories = [...DEFAULT_PURCHASE_CATEGORIES];
  }
  if (!db.purchaseCategories.includes(trimmed)) {
    db.purchaseCategories.push(trimmed);
    saveDatabase(db);
  }
  return trimmed;

  });
}

export function deletePurchaseCategory(category: string): string[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.purchaseCategories) {
    db.purchaseCategories = [...DEFAULT_PURCHASE_CATEGORIES];
  }
  db.purchaseCategories = db.purchaseCategories.filter((c) => c !== category.trim());
  saveDatabase(db);
  return db.purchaseCategories;

  });
}

export function resetTransactionLogs() {
  return withTransaction(() => {
  const db = getDatabase();
  db.fertilizerLogs = [];
  db.dieselLogs = [];
  db.machineryLogs = [];
  db.laborLogs = [];
  db.productionLogs = [];
  db.salesLogs = [];
  db.generalPurchaseLogs = [];
  saveDatabase(db);

  });
}

export const resetLogsForTesting = resetTransactionLogs;
