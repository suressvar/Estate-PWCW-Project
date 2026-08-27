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
