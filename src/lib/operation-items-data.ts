import { withTransaction } from "./db-storage";
import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import {
getDatabase,
OperationItem,
saveDatabase
} from "./db-storage";
import { finiteNumber,oneOf,requiredText } from "./validation";

export type { OperationItem };

export const OPERATION_ITEM_CATEGORIES = [
  "Fertilizer & Nutrition",
  "Diesel & Fuel",
  "Pesticides & Bio",
  "Seeds & Saplings",
  "Irrigation & Piping",
  "Machinery Spares & Repairs",
  "Tools & Hardware",
  "Crop Produce & Yield",
  "General Estate Supplies",
];

export const CATEGORY_PREFIX_MAP: Record<string, string> = {
  "Fertilizer & Nutrition": "FERT",
  "Diesel & Fuel": "DIES",
  "Pesticides & Bio": "PEST",
  "Seeds & Saplings": "SEED",
  "Irrigation & Piping": "IRR",
  "Machinery Spares & Repairs": "SPAR",
  "Tools & Hardware": "TOOL",
  "Crop Produce & Yield": "PROD",
  "General Estate Supplies": "ITEM",
};

export const DEFAULT_OPERATION_ITEMS: Omit<OperationItem, "id" | "createdAt" | "updatedAt">[] = [];

/**
 * Initializes operation items from database. Starts empty.
 */
function ensureOperationItems(): OperationItem[] {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.operationItems) {
    db.operationItems = [];
    saveDatabase(db);
  }
  return db.operationItems;

  });
}

/**
 * Clear all operation items.
 */
export function clearAllOperationItems(): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  db.operationItems = [];
  saveDatabase(db);
  return true;

  });
}

/**
 * Get all operation items with optional category, status, and text search filter.
 */
export function getOperationItems(filter?: {
  category?: string;
  status?: string;
  search?: string;
}): OperationItem[] {
  let list = ensureOperationItems();

  if (filter?.category && filter.category !== "ALL") {
    list = list.filter((item) => item.category === filter.category);
  }

  if (filter?.status && filter.status !== "ALL") {
    list = list.filter((item) => item.status === filter.status);
  }

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.itemCode.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        (item.plotName && item.plotName.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Get single operation item by ID.
 */
export function getOperationItemById(id: string): OperationItem | undefined {
  const items = ensureOperationItems();
  return items.find((i) => i.id === id);
}

/**
 * Check if an item code is unique across all items.
 */
export function isItemCodeUnique(itemCode: string, excludeId?: string): boolean {
  if (!itemCode || !itemCode.trim()) return false;
  const items = ensureOperationItems();
  const normalized = itemCode.trim().toUpperCase();
  return !items.some(
    (i) => i.itemCode.toUpperCase() === normalized && (!excludeId || i.id !== excludeId)
  );
}

/**
 * Auto-generate next item code based on category prefix (e.g. FERT-006, DIES-003).
 */
export function generateNextItemCode(category: string): string {
  const prefix = CATEGORY_PREFIX_MAP[category] || "ITEM";
  const items = ensureOperationItems();

  // Find existing numeric suffixes for this prefix
  const regex = new RegExp(`^${prefix}-(\\d+)$`, "i");
  let maxNum = 0;

  for (const item of items) {
    const match = item.itemCode.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = nextNum.toString().padStart(3, "0");
  return `${prefix}-${padded}`;
}

/**
 * Create a new operational item with custom or generated item code.
 */
export function createOperationItem(
  data: Omit<OperationItem, "id" | "createdAt" | "updatedAt">
): { success: boolean; item?: OperationItem; error?: string } {
  return withTransaction(() => {
  data.name = requiredText(data.name, "Item name");
  data.defaultRate = finiteNumber(data.defaultRate, "Default rate", 0, 0);
  data.currentStock = finiteNumber(data.currentStock, "Current stock", 0, 0);
  data.minStockAlert = finiteNumber(data.minStockAlert, "Stock alert", 0, 5);
  data.status = oneOf(data.status, ["ACTIVE", "INACTIVE"], "Item status", "ACTIVE");
  const db = getDatabase();
  ensureOperationItems();

  const code = (data.itemCode || generateNextItemCode(data.category)).trim().toUpperCase();

  if (!isItemCodeUnique(code)) {
    return {
      success: false,
      error: `Item code "${code}" is already assigned to another item. Please choose a unique code.`,
    };
  }

  const now = new Date().toISOString();
  const newItem: OperationItem = {
    ...data,
    id: `opitem_${randomUUID()}_${Math.floor(Math.random() * 1000)}`,
    itemCode: code,
    name: data.name.trim(),
    category: data.category || "General Estate Supplies",
    unit: data.unit || "Units",
    defaultRate: Number(data.defaultRate) || 0,
    minStockAlert: data.minStockAlert ?? 5,
    currentStock: Number(data.currentStock) || 0,
    status: data.status || "ACTIVE",
    description: data.description?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  if (!db.operationItems) db.operationItems = [];
  db.operationItems.unshift(newItem);
  saveDatabase(db);

  return { success: true, item: newItem };

  });
}

/**
 * Update an existing operational item.
 */
export function updateOperationItem(
  id: string,
  data: Partial<OperationItem>
): { success: boolean; item?: OperationItem; error?: string } {
  return withTransaction(() => {
  assertRecordId(id, data);
  if (data.name !== undefined) data.name = requiredText(data.name, "Item name");
  for (const key of ["defaultRate", "currentStock", "minStockAlert"] as const) if (data[key] !== undefined) data[key] = finiteNumber(data[key], key);
  if (data.status !== undefined) oneOf(data.status, ["ACTIVE", "INACTIVE"], "Item status");
  const db = getDatabase();
  ensureOperationItems();

  if (!db.operationItems) return { success: false, error: "Items database not initialized" };

  const idx = db.operationItems.findIndex((i) => i.id === id);
  if (idx === -1) return { success: false, error: "Item not found" };

  // If item code is changing, check uniqueness
  if (data.itemCode) {
    const newCode = data.itemCode.trim().toUpperCase();
    if (!isItemCodeUnique(newCode, id)) {
      return {
        success: false,
        error: `Item code "${newCode}" is already taken by another item.`,
      };
    }
    data.itemCode = newCode;
  }

  const updated: OperationItem = {
    ...db.operationItems[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.operationItems[idx] = updated;
  saveDatabase(db);

  return { success: true, item: updated };

  });
}

/**
 * Directly assign or reassign an item code to an item.
 */
export function assignItemCode(
  id: string,
  itemCode: string
): { success: boolean; item?: OperationItem; error?: string } {
  const trimmed = itemCode.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, error: "Item code cannot be empty" };
  }

  return updateOperationItem(id, { itemCode: trimmed });
}

/**
 * Delete an operational item.
 */
export function deleteOperationItem(id: string): boolean {
  return withTransaction(() => {
  const db = getDatabase();
  ensureOperationItems();

  if (!db.operationItems) return false;
  const initialLen = db.operationItems.length;
  db.operationItems = db.operationItems.filter((i) => i.id !== id);
  saveDatabase(db);
  return db.operationItems.length < initialLen;

  });
}

/**
 * Summary metrics for operation items.
 */
export function getOperationItemStats() {
  const items = ensureOperationItems();
  const totalItems = items.length;
  const codedItems = items.filter((i) => i.itemCode && i.itemCode.trim().length > 0).length;
  const activeItems = items.filter((i) => i.status === "ACTIVE").length;
  const categories = Array.from(new Set(items.map((i) => i.category))).filter(Boolean);
  const totalStockValuation = items.reduce(
    (sum, i) => sum + (Number(i.currentStock) || 0) * (Number(i.defaultRate) || 0),
    0
  );

  return {
    totalItems,
    codedItems,
    uncodedItems: totalItems - codedItems,
    activeItems,
    categoriesCount: categories.length,
    totalStockValuation,
  };
}
