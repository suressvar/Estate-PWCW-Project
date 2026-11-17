import { randomUUID } from "node:crypto";
import { withTransaction } from "./db-storage";
import { getExpenseLedgerById } from "./accounting-data";
import {
ExpenseUnit,
FeedPurchase,
getDatabase,
MedicinePurchase,
OtherVoucher,
saveDatabase,
VaccinePurchase,
} from "./db-storage";
import { dateKey,finiteNumber,oneOf,positiveNumber,ValidationError } from "./validation";

export type VoucherType = "feed" | "medicine" | "vaccine" | "other";

export type { ExpenseUnit,FeedPurchase,MedicinePurchase,OtherVoucher,VaccinePurchase };

export function getExpenseUnits(): ExpenseUnit[] {
  return getDatabase().expenseUnits;
}

export function createExpenseUnit(payload: { unitName: string; unitSymbol: string }): ExpenseUnit {
  return withTransaction(() => {
  const db = getDatabase();
  const newUnit: ExpenseUnit = {
    id: `u_${randomUUID()}`,
    unitName: payload.unitName,
    unitSymbol: payload.unitSymbol,
  };
  db.expenseUnits.push(newUnit);
  saveDatabase(db);
  return newUnit;

  });
}

export function deleteExpenseUnit(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  db.expenseUnits = db.expenseUnits.filter((u) => u.id !== id);
  saveDatabase(db);
  return true;

  });
}

export function getVouchersSummary() {
  const db = getDatabase();
  return {
    feedCount: db.feedPurchases.length,
    feedTotal: db.feedPurchases.reduce((acc, p) => acc + p.cost, 0),
    medicineCount: db.medicinePurchases.length,
    medicineTotal: db.medicinePurchases.reduce((acc, p) => acc + p.cost, 0),
    vaccineCount: db.vaccinePurchases.length,
    vaccineTotal: db.vaccinePurchases.reduce((acc, p) => acc + p.cost, 0),
    otherCount: db.otherVouchers.length,
    otherTotal: db.otherVouchers.reduce((acc, p) => acc + p.amount, 0),
  };
}

type Voucher = FeedPurchase | MedicinePurchase | VaccinePurchase | OtherVoucher;
type VoucherRecord = FeedPurchase & MedicinePurchase & VaccinePurchase & OtherVoucher;
type VoucherInput = Partial<VoucherRecord>;
export function getVouchers(type: "feed"): FeedPurchase[];
export function getVouchers(type: "medicine"): MedicinePurchase[];
export function getVouchers(type: "vaccine"): VaccinePurchase[];
export function getVouchers(type: "other"): OtherVoucher[];
export function getVouchers(type: string): Voucher[];
export function getVouchers(type: VoucherType | string): Voucher[] {
  const db = getDatabase();
  switch (type) {
    case "feed":
      return db.feedPurchases;
    case "medicine":
      return db.medicinePurchases;
    case "vaccine":
      return db.vaccinePurchases;
    case "other":
      return db.otherVouchers;
    default:
      return [];
  }
}

export function getVoucherById(type: VoucherType | string, id: string) {
  const list = getVouchers(type);
  return list.find((item) => item.id === id);
}

function createVoucherImpl(type: VoucherType | string, payload: VoucherInput) {
  oneOf(type, ["feed", "medicine", "vaccine", "other"], "Voucher type");
  if (payload.quantity !== undefined) payload.quantity = positiveNumber(payload.quantity, "Quantity");
  if (payload.cost !== undefined) payload.cost = finiteNumber(payload.cost, "Cost");
  if (payload.amount !== undefined) payload.amount = finiteNumber(payload.amount, "Amount");
  if (payload.purchaseDate) dateKey(payload.purchaseDate);
  if (payload.voucherDate) dateKey(payload.voucherDate);
  const db = getDatabase();
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName || "Direct Expenses";
  const pnlCategory = ledger?.groupType === "EXPENSE" ? "Purchase" : payload.pnlCategory || "Purchase";

  const record: VoucherRecord = {
    feedName: payload.feedName || "Procured Item", medicineName: payload.medicineName || "Procured Item",
    vaccineName: payload.vaccineName || "Procured Item", quantity: payload.quantity ?? 1,
    unit: payload.unit || "units", cost: payload.cost ?? payload.amount ?? 0,
    amount: payload.amount ?? payload.cost ?? 0,
    purchaseDate: payload.purchaseDate || new Date().toISOString().slice(0, 10),
    voucherDate: payload.voucherDate || new Date().toISOString().slice(0, 10),
    ...payload,
    id: `${type.slice(0, 2)}_${randomUUID()}`,
    ledgerId: payload.ledgerId || "",
    particularName,
    pnlCategory,
    createdAt: new Date().toISOString().split("T")[0],
  };

  switch (type) {
    case "feed":
      db.feedPurchases.unshift(record);
      break;
    case "medicine":
      db.medicinePurchases.unshift(record);
      break;
    case "vaccine":
      db.vaccinePurchases.unshift(record);
      break;
    case "other":
      db.otherVouchers.unshift(record);
      break;
    default:
      break;
  }

  // Auto-inward into Godown
  try {
    const itemName =
      record.feedName ||
      record.medicineName ||
      record.vaccineName ||
      record.notes ||
      particularName ||
      "Procured Estate Item";
    const qty = Number(record.quantity) || 1;
    const amount = Number(record.amount) || Number(record.cost) || 0;
    const rate = qty > 0 ? Math.round((amount / qty) * 100) / 100 : amount;
    const category =
      type === "feed"
        ? "Feed & Nutrition"
        : type === "medicine"
        ? "Medicine & Veterinary"
        : type === "vaccine"
        ? "Vaccines & Bio"
        : "General Purchases";

    if (!db.godownItems) db.godownItems = [];
    if (!db.godownMovements) db.godownMovements = [];

    const gdnItem = {
      id: `gdn_${randomUUID()}_${Math.floor(Math.random() * 1000)}`,
      name: itemName,
      category,
      sourceVoucherId: record.id,
      sourceVoucherNo: record.billNo || `VCH-${record.id}`,
      vendorName: record.supplier || record.supplierName || "Vendor Procurement",
      receivedDate: record.purchaseDate || record.voucherDate || new Date().toISOString().split("T")[0],
      totalReceivedQuantity: qty,
      availableQuantity: qty,
      unit: record.unit || record.unitName || record.doseUnit || "units",
      ratePerUnit: rate,
      totalValue: amount,
      location: type === "feed" ? "Fodder & Feed Godown" : "Main Godown Store",
      minStockAlert: Math.max(1, Math.round(qty * 0.2)),
      status: "IN_STOCK" as const,
      notes: record.notes || `Procured via ${type} voucher`,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    db.godownItems.unshift(gdnItem);

    db.godownMovements.unshift({
      id: `mov_${randomUUID()}_${Math.floor(Math.random() * 1000)}`,
      godownItemId: gdnItem.id,
      itemName: gdnItem.name,
      category: gdnItem.category,
      movementType: "INWARD_PURCHASE",
      quantity: qty,
      unit: gdnItem.unit,
      ratePerUnit: rate,
      totalCost: amount,
      source: gdnItem.vendorName ? `Vendor Purchase (${gdnItem.vendorName})` : "Purchase Voucher",
      destinationMenu: "Godown Central Store",
      destinationRoute: "/godown",
      date: gdnItem.receivedDate,
      notes: `Inward from ${gdnItem.sourceVoucherNo}`,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Error inwarding voucher to godown:", e);
  }

  saveDatabase(db);
  return record;
}

function updateVoucherImpl(type: VoucherType | string, id: string, payload: VoucherInput) {
  oneOf(type, ["feed", "medicine", "vaccine", "other"], "Voucher type");
  if (payload.id !== undefined && payload.id !== id) throw new ValidationError("Voucher ID cannot be changed.");
  if (payload.quantity !== undefined) payload.quantity = positiveNumber(payload.quantity, "Quantity");
  if (payload.cost !== undefined) payload.cost = finiteNumber(payload.cost, "Cost");
  if (payload.amount !== undefined) payload.amount = finiteNumber(payload.amount, "Amount");
  if (payload.purchaseDate) dateKey(payload.purchaseDate);
  if (payload.voucherDate) dateKey(payload.voucherDate);
  const db = getDatabase();
  const linked = (db.godownItems || []).filter(item => item.sourceVoucherId === id);
  // Validate every correction before mutating any row.
  const corrections = linked.map(item => {
    const quantity = payload.quantity ?? item.totalReceivedQuantity;
    const amount = payload.amount ?? payload.cost ?? quantity * item.ratePerUnit;
    const rate = amount / quantity;
    const issued = item.totalReceivedQuantity - item.availableQuantity;
    if (quantity < issued) throw new ValidationError("Corrected quantity cannot be lower than stock already issued.");
    if (issued > 0 && Math.abs(rate - item.ratePerUnit) > 0.00001) throw new ValidationError("The rate cannot be changed after stock has been issued. Record a separate adjustment.");
    return { item, quantity, amount, rate, available: quantity - issued };
  });
  for (const correction of corrections) {
    Object.assign(correction.item, { totalReceivedQuantity: correction.quantity, availableQuantity: correction.available, ratePerUnit: correction.rate, totalValue: correction.available * correction.rate, lastUpdated: new Date().toISOString() });
    for (const movement of db.godownMovements || []) {
      if (movement.godownItemId === correction.item.id && movement.movementType === "INWARD_PURCHASE") {
        Object.assign(movement, { quantity: correction.quantity, ratePerUnit: correction.rate, totalCost: correction.amount });
      }
    }
  }
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName;

  const updateHelper = <T extends Voucher>(list: T[]) =>
    list.map((item) => (item.id === id ? { ...item, ...payload, particularName: particularName || item.particularName } : item));

  switch (type) {
    case "feed":
      db.feedPurchases = updateHelper(db.feedPurchases);
      saveDatabase(db);
      return db.feedPurchases.find((i) => i.id === id);
    case "medicine":
      db.medicinePurchases = updateHelper(db.medicinePurchases);
      saveDatabase(db);
      return db.medicinePurchases.find((i) => i.id === id);
    case "vaccine":
      db.vaccinePurchases = updateHelper(db.vaccinePurchases);
      saveDatabase(db);
      return db.vaccinePurchases.find((i) => i.id === id);
    case "other":
      db.otherVouchers = updateHelper(db.otherVouchers);
      saveDatabase(db);
      return db.otherVouchers.find((i) => i.id === id);
    default:
      return null;
  }
}

function deleteVoucherImpl(type: VoucherType | string, id: string): boolean {
  const db = getDatabase();
  oneOf(type, ["feed", "medicine", "vaccine", "other"], "Voucher type");
  const linked = (db.godownItems || []).filter(item => item.sourceVoucherId === id);
  if (linked.some(item => item.availableQuantity < item.totalReceivedQuantity)) throw new ValidationError("This purchase has issued stock and cannot be deleted. Record a reversal or adjustment first.");
  const itemIds = new Set(linked.map(item => item.id));
  db.godownItems = (db.godownItems || []).filter(item => !itemIds.has(item.id));
  db.godownMovements = (db.godownMovements || []).filter(movement => !itemIds.has(movement.godownItemId));
  switch (type) {
    case "feed":
      db.feedPurchases = db.feedPurchases.filter((i) => i.id !== id);
      saveDatabase(db);
      return true;
    case "medicine":
      db.medicinePurchases = db.medicinePurchases.filter((i) => i.id !== id);
      saveDatabase(db);
      return true;
    case "vaccine":
      db.vaccinePurchases = db.vaccinePurchases.filter((i) => i.id !== id);
      saveDatabase(db);
      return true;
    case "other":
      db.otherVouchers = db.otherVouchers.filter((i) => i.id !== id);
      saveDatabase(db);
      return true;
    default:
      return false;
  }
}

export function resetVouchersData() {
  return withTransaction(() => {
  const db = getDatabase();
  db.feedPurchases = [];
  db.medicinePurchases = [];
  db.vaccinePurchases = [];
  db.otherVouchers = [];
  saveDatabase(db);

  });
}

export function createVoucher(...args: Parameters<typeof createVoucherImpl>) {
  return withTransaction(() => createVoucherImpl(...args));
}

export function updateVoucher(...args: Parameters<typeof updateVoucherImpl>) {
  return withTransaction(() => updateVoucherImpl(...args));
}

export function deleteVoucher(...args: Parameters<typeof deleteVoucherImpl>) {
  return withTransaction(() => deleteVoucherImpl(...args));
}
