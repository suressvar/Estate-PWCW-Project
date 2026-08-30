import {
  getDatabase,
  saveDatabase,
  BaseLog,
  VoucherLineItem,
  FertilizerLogItem,
  DieselLogItem,
  MachineryLogItem,
  LaborLogItem,
  ProductionLogItem,
  SalesLogItem,
  PurchaseVoucherItem,
  GeneralPurchaseLogItem,
  DEFAULT_PURCHASE_CATEGORIES,
} from "./db-storage";

export type {
  BaseLog,
  VoucherLineItem,
  FertilizerLogItem,
  DieselLogItem,
  MachineryLogItem,
  LaborLogItem,
  ProductionLogItem,
  SalesLogItem,
  PurchaseVoucherItem,
  GeneralPurchaseLogItem,
};

export { MACHINE_RATES } from "@/types/estate";

export function getFertilizerLogs(): FertilizerLogItem[] {
  return getDatabase().fertilizerLogs;
}

export function addFertilizerLog(data: Omit<FertilizerLogItem, "id" | "createdAt">): FertilizerLogItem {
  const db = getDatabase();
  const item: FertilizerLogItem = { ...data, id: `fert_${Date.now()}`, createdAt: new Date().toISOString() };
  db.fertilizerLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function getDieselLogs(): DieselLogItem[] {
  return getDatabase().dieselLogs;
}

export function addDieselLog(data: Omit<DieselLogItem, "id" | "createdAt">): DieselLogItem {
  const db = getDatabase();
  const item: DieselLogItem = { ...data, id: `diesel_${Date.now()}`, createdAt: new Date().toISOString() };
  db.dieselLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function getMachineryLogs(): MachineryLogItem[] {
  return getDatabase().machineryLogs;
}

export function addMachineryLog(data: Omit<MachineryLogItem, "id" | "createdAt">): MachineryLogItem {
  const db = getDatabase();
  const item: MachineryLogItem = { ...data, id: `mach_${Date.now()}`, createdAt: new Date().toISOString() };
  db.machineryLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function getLaborLogs(): LaborLogItem[] {
  return getDatabase().laborLogs;
}

export function addLaborLog(data: Omit<LaborLogItem, "id" | "createdAt">): LaborLogItem {
  const db = getDatabase();
  const item: LaborLogItem = { ...data, id: `labor_${Date.now()}`, createdAt: new Date().toISOString() };
  db.laborLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function getProductionLogs(): ProductionLogItem[] {
  return getDatabase().productionLogs;
}

export function addProductionLog(data: Omit<ProductionLogItem, "id" | "createdAt">): ProductionLogItem {
  const db = getDatabase();
  const item: ProductionLogItem = { ...data, id: `prod_${Date.now()}`, createdAt: new Date().toISOString() };
  db.productionLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function getSalesLogs(): SalesLogItem[] {
  return getDatabase().salesLogs;
}

export function addSalesLog(data: Omit<SalesLogItem, "id" | "createdAt">): SalesLogItem {
  const db = getDatabase();
  const currentCount = db.salesLogs.length + 1;
  const voucherNo = data.voucherNo || `SLS-VCH-2026-${String(currentCount).padStart(3, "0")}`;
  const item: SalesLogItem = {
    ...data,
    id: `sales_${Date.now()}`,
    voucherNo,
    subtotal: data.subtotal ?? data.value,
    createdAt: new Date().toISOString(),
  };
  db.salesLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function deleteSalesLog(id: string): boolean {
  const db = getDatabase();
  db.salesLogs = db.salesLogs.filter((s) => s.id !== id);
  saveDatabase(db);
  return true;
}

export function getGeneralPurchaseLogs(): GeneralPurchaseLogItem[] {
  return getDatabase().generalPurchaseLogs;
}

export function addGeneralPurchaseLog(data: Omit<PurchaseVoucherItem, "id" | "createdAt">): GeneralPurchaseLogItem {
  const db = getDatabase();
  const currentCount = db.generalPurchaseLogs.length + 1;
  const voucherNo = data.voucherNo || `PUR-VCH-2026-${String(currentCount).padStart(3, "0")}`;
  const item: PurchaseVoucherItem = {
    ...data,
    id: `gen_${Date.now()}`,
    voucherNo,
    subtotal: data.subtotal ?? data.cost,
    createdAt: new Date().toISOString(),
  };
  db.generalPurchaseLogs.unshift(item);
  saveDatabase(db);
  return item;
}

export function deleteGeneralPurchaseLog(id: string): boolean {
  const db = getDatabase();
  db.generalPurchaseLogs = db.generalPurchaseLogs.filter((g) => g.id !== id);
  saveDatabase(db);
  return true;
}

export function getPurchaseCategories(): string[] {
  const db = getDatabase();
  if (!db.purchaseCategories || !Array.isArray(db.purchaseCategories) || db.purchaseCategories.length === 0) {
    const existingVoucherCats = (db.generalPurchaseLogs || []).map((v) => v.category).filter(Boolean);
    db.purchaseCategories = Array.from(new Set([...DEFAULT_PURCHASE_CATEGORIES, ...existingVoucherCats]));
    saveDatabase(db);
  }
  return db.purchaseCategories;
}

export function createPurchaseCategory(category: string): string {
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
}

export function resetTransactionLogs() {
  const db = getDatabase();
  db.fertilizerLogs = [];
  db.dieselLogs = [];
  db.machineryLogs = [];
  db.laborLogs = [];
  db.productionLogs = [];
  db.salesLogs = [];
  db.generalPurchaseLogs = [];
  saveDatabase(db);
}

export const resetLogsForTesting = resetTransactionLogs;
