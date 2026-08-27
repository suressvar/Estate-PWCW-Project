import {
  getDatabase,
  saveDatabase,
  InventoryType,
  StockInventoryItem,
  ManualStockValuationItem,
} from "./db-storage";

export type { InventoryType, StockInventoryItem, ManualStockValuationItem };

function calculateItemStatus(closing: number, alertLevel: number): "ADEQUATE" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (closing <= 0) return "OUT_OF_STOCK";
  if (closing <= alertLevel) return "LOW_STOCK";
  return "ADEQUATE";
}

export function getInventory(type: InventoryType): StockInventoryItem[] {
  const db = getDatabase();
  let list: StockInventoryItem[] = [];
  if (type === "feed") list = db.feedInventory;
  else if (type === "medicine") list = db.medicineInventory;
  else if (type === "vaccine") list = db.vaccineInventory;

  return list.map((item) => {
    const closing = item.openingStock + item.purchasedQty - item.usedQty - item.wastageQty;
    const totalCost = closing * item.costPerUnit;
    const status = calculateItemStatus(closing, item.alertLevel);
    return {
      ...item,
      closingStock: closing,
      totalCost,
      status,
    };
  });
}

export function getAllInventoryAlerts(): StockInventoryItem[] {
  const all = [
    ...getInventory("feed"),
    ...getInventory("medicine"),
    ...getInventory("vaccine"),
  ];
  return all.filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK");
}

export function updateInventoryRecord(type: InventoryType, id: string, payload: { usedQty?: number; wastageQty?: number; alertLevel?: number; costPerUnit?: number }) {
  const db = getDatabase();
  const updater = (items: StockInventoryItem[]) =>
    items.map((item) => {
      if (item.id === id) {
        const usedQty = payload.usedQty !== undefined ? Number(payload.usedQty) : item.usedQty;
        const wastageQty = payload.wastageQty !== undefined ? Number(payload.wastageQty) : item.wastageQty;
        const alertLevel = payload.alertLevel !== undefined ? Number(payload.alertLevel) : item.alertLevel;
        const costPerUnit = payload.costPerUnit !== undefined ? Number(payload.costPerUnit) : item.costPerUnit;
        const closing = item.openingStock + item.purchasedQty - usedQty - wastageQty;
        const totalCost = closing * costPerUnit;
        const status = calculateItemStatus(closing, alertLevel);

        return {
          ...item,
          usedQty,
          wastageQty,
          alertLevel,
          costPerUnit,
          closingStock: closing,
          totalCost,
          status,
          lastUpdated: new Date().toISOString().split("T")[0],
        };
      }
      return item;
    });

  if (type === "feed") db.feedInventory = updater(db.feedInventory);
  else if (type === "medicine") db.medicineInventory = updater(db.medicineInventory);
  else if (type === "vaccine") db.vaccineInventory = updater(db.vaccineInventory);

  saveDatabase(db);
  return getInventory(type).find((i) => i.id === id);
}

// =================== STOCK VALUATIONS ===================
export function getStockValuations(): ManualStockValuationItem[] {
  return getDatabase().stockValuations;
}

export function createStockValuation(data: Omit<ManualStockValuationItem, "id" | "createdAt">): ManualStockValuationItem {
  const db = getDatabase();
  const newRecord: ManualStockValuationItem = {
    ...data,
    id: `sv_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  db.stockValuations.unshift(newRecord);
  saveDatabase(db);
  return newRecord;
}

export function updateStockValuation(id: string, data: Partial<ManualStockValuationItem>) {
  const db = getDatabase();
  db.stockValuations = db.stockValuations.map((v) => (v.id === id ? { ...v, ...data } : v));
  saveDatabase(db);
  return db.stockValuations.find((v) => v.id === id);
}

export function deleteStockValuation(id: string): boolean {
  const db = getDatabase();
  db.stockValuations = db.stockValuations.filter((v) => v.id !== id);
  saveDatabase(db);
  return true;
}

export function resetInventoryData() {
  const db = getDatabase();
  db.feedInventory = [];
  db.medicineInventory = [];
  db.vaccineInventory = [];
  db.stockValuations = [];
  saveDatabase(db);
}
