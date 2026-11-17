import { withTransaction } from "./db-storage";
import { money } from './money';
import { nextReference } from './references';
import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import { getExpenseLedgerById } from "./accounting-data";
import { getDatabase,OtherSaleItem,saveDatabase } from "./db-storage";
import { dateKey,finiteNumber,oneOf,positiveNumber,requiredText,ValidationError } from "./validation";

export type SaleType = "crop" | "other";

export type { OtherSaleItem };

export function getOtherSales(): OtherSaleItem[] {
  return getDatabase().otherSales;
}

export function getSaleById(type: string, id: string) {
  const db = getDatabase();
  return db.otherSales.find((s) => s.id === id);
}

export function getSalesByInvoiceGroup(invoiceGroupId: string) {
  const db = getDatabase();
  let otherItems = db.otherSales.filter((s) => s.invoiceGroupId === invoiceGroupId);
  if (otherItems.length === 0) {
    const single = db.otherSales.find((s) => s.id === invoiceGroupId || s.srNo === invoiceGroupId);
    if (single) otherItems = [single];
  }

  const buyerName = otherItems[0]?.buyerName || "Walk-in Customer";
  const buyerCity = otherItems[0]?.buyerCity || "";
  const buyerContact = otherItems[0]?.buyerContact || "";
  const dateOfSale = otherItems[0]?.dateOfSale || new Date().toISOString().split("T")[0];
  const category = otherItems[0]?.category || "General Estate Sales";

  const totalAmount = otherItems.reduce((acc, i) => acc + i.totalAmount, 0);

  return {
    invoiceGroupId,
    dateOfSale,
    buyerName,
    buyerCity,
    buyerContact,
    category,
    otherItems,
    totalAmount,
  };
}

export function getSalesCategories(): string[] {
  const db = getDatabase();
  return db.salesCategories || [];
}

export function addSalesCategory(category: string): string[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.salesCategories) db.salesCategories = [];
  const trimmed = category.trim();
  if (trimmed && !db.salesCategories.includes(trimmed)) {
    db.salesCategories.push(trimmed);
    saveDatabase(db);
  }
  return db.salesCategories;

  });
}

export function deleteSalesCategory(category: string): string[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.salesCategories) return [];
  db.salesCategories = db.salesCategories.filter((c) => c !== category.trim());
  saveDatabase(db);
  return db.salesCategories;

  });
}

type SaleInput = Partial<OtherSaleItem> & { items: Partial<OtherSaleItem>[]; recordNo?: string };
export function createMultiItemSale(type: string, payload: SaleInput) {
  return withTransaction(() => {
  oneOf(type, ["crop", "other"], "Sale type");
  if (!Array.isArray(payload.items) || payload.items.length === 0) throw new ValidationError("At least one invoice item is required.");
  if (payload.dateOfSale) dateKey(payload.dateOfSale);
  for (const item of payload.items) {
    requiredText(item.itemName, "Item name"); positiveNumber(item.quantity, "Quantity"); finiteNumber(item.pricePerUnit, "Price per unit");
  }
  const db = getDatabase();
  const invoiceGroupId = `inv_${randomUUID()}`;
  if (payload.recordNo !== undefined && payload.recordNo !== '') {
    payload.recordNo = requiredText(payload.recordNo, 'Record number');
    if (db.otherSales.some(item => item.srNo === payload.recordNo)) throw new ValidationError('Sales record number already exists.');
  }
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName || "Crop & Produce Sales";
  const category = payload.category?.trim() || "General Estate Sales";

  const created: OtherSaleItem[] = [];
  const items = payload.items || [];
  items.forEach((item, idx: number) => {
    const srNo = payload.recordNo
      ? String(payload.recordNo)
      : nextReference(db, 'OSR-', db.otherSales.map(item => item.srNo), 4);
    const qty = positiveNumber(item.quantity, "Quantity");
    const rate = finiteNumber(item.pricePerUnit, "Price per unit");
    const record: OtherSaleItem = {
      id: `os_${randomUUID()}_${idx}`,
      srNo,
      itemName: item.itemName || "Crop Produce",
      quantity: qty,
      unit: item.unit || "kg",
      pricePerUnit: rate,
      totalAmount: money(qty * rate),
      dateOfSale: payload.dateOfSale || new Date().toISOString().split("T")[0],
      buyerName: payload.buyerName || "Walk-in Customer",
      buyerCity: payload.buyerCity,
      buyerContact: payload.buyerContact,
      ledgerId: payload.ledgerId,
      particularName,
      category: item.category?.trim() || category,
      pnlCategory: "Sales",
      notes: payload.notes || item.notes,
      invoiceGroupId,
      createdAt: new Date().toISOString().split("T")[0],
    };
    db.otherSales.unshift(record);
    created.push(record);
  });

  saveDatabase(db);
  return { invoiceGroupId, items: created };

  });
}

export function updateSale(type: string, id: string, payload: Partial<OtherSaleItem>) {
  return withTransaction(() => {
  assertRecordId(id, payload);
  if (payload.quantity !== undefined) positiveNumber(payload.quantity, "Quantity");
  if (payload.pricePerUnit !== undefined) finiteNumber(payload.pricePerUnit, "Price per unit");
  if (payload.dateOfSale !== undefined) dateKey(payload.dateOfSale);
  const db = getDatabase();
  db.otherSales = db.otherSales.map((s) => {
    if (s.id === id) {
      const qty = payload.quantity !== undefined ? Number(payload.quantity) : s.quantity;
      const rate = payload.pricePerUnit !== undefined ? Number(payload.pricePerUnit) : s.pricePerUnit;
      return {
        ...s,
        ...payload,
        quantity: qty,
        pricePerUnit: rate,
        totalAmount: money(qty * rate),
      };
    }
    return s;
  });
  saveDatabase(db);
  return db.otherSales.find((s) => s.id === id);

  });
}

export function deleteSale(type: string, id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  db.otherSales = db.otherSales.filter((s) => s.id !== id);
  saveDatabase(db);
  return true;

  });
}

export function calculateSalesAnalytics() {
  const db = getDatabase();
  const sales = db.otherSales;
  const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);
  const totalInvoices = new Set(sales.map((s) => s.invoiceGroupId || s.id)).size;
  const avgOrderValue = totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0;
  const topProduct = sales.length > 0 ? sales[0].itemName : "No items sold";

  // Category breakdown
  const categoryMap: Record<string, number> = {};
  sales.forEach((s) => {
    const key = s.itemName.split(" ")[0] || "Produce";
    categoryMap[key] = (categoryMap[key] || 0) + s.totalAmount;
  });

  const categoryDistribution = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }));

  // Monthly breakdown
  const monthlyRevenueMap: Record<string, number> = {};
  sales.forEach((s) => {
    const month = s.dateOfSale ? s.dateOfSale.substring(0, 7) : "2026-07";
    monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + s.totalAmount;
  });

  const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  return {
    kpis: {
      totalRevenue,
      totalInvoices,
      avgOrderValue,
      topProduct,
    },
    monthlyRevenue,
    categoryDistribution,
    recentTransactions: sales.slice(0, 10),
  };
}

export const getSalesAnalytics = calculateSalesAnalytics;
export const updateSaleItem = updateSale;
export const deleteSaleItem = deleteSale;

export function resetSalesData() {
  return withTransaction(() => {
  const db = getDatabase();
  db.otherSales = [];
  db.salesLogs = [];
  saveDatabase(db);
  return true;

  });
}

export const clearAllSales = resetSalesData;
