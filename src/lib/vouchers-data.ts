import {
  getDatabase,
  saveDatabase,
  ExpenseUnit,
  FeedPurchase,
  MedicinePurchase,
  VaccinePurchase,
  OtherVoucher,
} from "./db-storage";
import { getExpenseLedgerById } from "./accounting-data";

export type VoucherType = "feed" | "medicine" | "vaccine" | "other";

export type { ExpenseUnit, FeedPurchase, MedicinePurchase, VaccinePurchase, OtherVoucher };

export function getExpenseUnits(): ExpenseUnit[] {
  return getDatabase().expenseUnits;
}

export function createExpenseUnit(payload: { unitName: string; unitSymbol: string }): ExpenseUnit {
  const db = getDatabase();
  const newUnit: ExpenseUnit = {
    id: `u_${Date.now()}`,
    unitName: payload.unitName,
    unitSymbol: payload.unitSymbol,
  };
  db.expenseUnits.push(newUnit);
  saveDatabase(db);
  return newUnit;
}

export function deleteExpenseUnit(id: string): boolean {
  const db = getDatabase();
  db.expenseUnits = db.expenseUnits.filter((u) => u.id !== id);
  saveDatabase(db);
  return true;
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

export function getVouchers(type: VoucherType | string): any[] {
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
  return (list as any[]).find((item) => item.id === id);
}

export function createVoucher(type: VoucherType | string, payload: any) {
  const db = getDatabase();
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName || "Direct Expenses";
  const pnlCategory = ledger?.groupType === "EXPENSE" ? "Purchase" : payload.pnlCategory || "Purchase";

  const record: any = {
    ...payload,
    id: `${type.slice(0, 2)}_${Date.now()}`,
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
      id: `gdn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
      id: `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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

export function updateVoucher(type: VoucherType | string, id: string, payload: any) {
  const db = getDatabase();
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName;

  const updateHelper = (list: any[]) =>
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

export function deleteVoucher(type: VoucherType | string, id: string): boolean {
  const db = getDatabase();
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
  const db = getDatabase();
  db.feedPurchases = [];
  db.medicinePurchases = [];
  db.vaccinePurchases = [];
  db.otherVouchers = [];
  saveDatabase(db);
}
