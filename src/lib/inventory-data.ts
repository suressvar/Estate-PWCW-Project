export type InventoryType = "feed" | "medicine" | "vaccine";

export interface StockInventoryItem {
  id: string;
  itemType: InventoryType;
  name: string;
  openingStock: number;
  purchasedQty: number;
  usedQty: number;
  wastageQty: number;
  closingStock: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  supplier?: string;
  alertLevel: number;
  status: "ADEQUATE" | "LOW_STOCK" | "OUT_OF_STOCK";
  lastUpdated: string;
}

export interface ManualStockValuationItem {
  id: string;
  periodName: string;
  fromDate: string;
  toDate: string;
  openingStock: number;
  closingStock: number;
  createdAt: string;
}

// Seed Feed Inventory
let mockFeedInventory: StockInventoryItem[] = [
  { id: "fi-1", itemType: "feed", name: "Maize Silage Dry Bales", openingStock: 20, purchasedQty: 50, usedQty: 35, wastageQty: 2, closingStock: 33, unit: "bags", costPerUnit: 450, totalCost: 14850, supplier: "Supreme Silage & Agro", alertLevel: 15, status: "ADEQUATE", lastUpdated: "2026-08-01" },
  { id: "fi-2", itemType: "feed", name: "High-Protein Crop Nutrition Mash", openingStock: 10, purchasedQty: 20, usedQty: 24, wastageQty: 1, closingStock: 5, unit: "bags", costPerUnit: 1400, totalCost: 7000, supplier: "Supreme Silage & Agro", alertLevel: 8, status: "LOW_STOCK", lastUpdated: "2026-08-01" },
  { id: "fi-3", itemType: "feed", name: "Organic Bio-Fertilizer & Soil Nutrient Mix", openingStock: 8, purchasedQty: 10, usedQty: 6, wastageQty: 0, closingStock: 12, unit: "nos", costPerUnit: 350, totalCost: 4200, supplier: "AgriCare Supplies", alertLevel: 4, status: "ADEQUATE", lastUpdated: "2026-08-01" },
  { id: "fi-4", itemType: "feed", name: "Green Lucerne / CO4 Grass Chop", openingStock: 0, purchasedQty: 100, usedQty: 100, wastageQty: 0, closingStock: 0, unit: "kg", costPerUnit: 6, totalCost: 0, supplier: "Local Farm Vendor", alertLevel: 20, status: "OUT_OF_STOCK", lastUpdated: "2026-08-01" },
];

// Seed Medicine Inventory
let mockMedicineInventory: StockInventoryItem[] = [
  { id: "mi-1", itemType: "medicine", name: "Organic Crop Bio-Protector & Spray", openingStock: 2, purchasedQty: 5, usedQty: 6, wastageQty: 1, closingStock: 0, unit: "L", costPerUnit: 640, totalCost: 0, supplier: "AgriCare Supplies", alertLevel: 2, status: "OUT_OF_STOCK", lastUpdated: "2026-08-01" },
  { id: "mi-2", itemType: "medicine", name: "Plant Micronutrient Growth Tonic", openingStock: 5, purchasedQty: 15, usedQty: 12, wastageQty: 0, closingStock: 8, unit: "vials", costPerUnit: 183, totalCost: 1464, supplier: "AgriCare Supplies", alertLevel: 4, status: "ADEQUATE", lastUpdated: "2026-08-01" },
  { id: "mi-3", itemType: "medicine", name: "Oxytetracycline 20% LA Injectable", openingStock: 5, purchasedQty: 5, usedQty: 7, wastageQty: 0, closingStock: 3, unit: "vials", costPerUnit: 250, totalCost: 750, supplier: "VetCare Supplies", alertLevel: 2, status: "ADEQUATE", lastUpdated: "2026-08-01" },
];

// Seed Vaccine Inventory
let mockVaccineInventory: StockInventoryItem[] = [
  { id: "vi-1", itemType: "vaccine", name: "Rhizobium Bio-Culture", openingStock: 1, purchasedQty: 4, usedQty: 3, wastageQty: 0, closingStock: 2, unit: "doses", costPerUnit: 600, totalCost: 1200, supplier: "Biological Agro Labs", alertLevel: 2, status: "LOW_STOCK", lastUpdated: "2026-08-01" },
  { id: "vi-2", itemType: "vaccine", name: "Trichoderma Viride Bio-Fungicide", openingStock: 2, purchasedQty: 3, usedQty: 2, wastageQty: 0, closingStock: 3, unit: "doses", costPerUnit: 600, totalCost: 1800, supplier: "Biological Agro Labs", alertLevel: 2, status: "ADEQUATE", lastUpdated: "2026-08-01" },
  { id: "vi-3", itemType: "vaccine", name: "Bio-Shield Plant Defense Formulation", openingStock: 2, purchasedQty: 2, usedQty: 1, wastageQty: 0, closingStock: 3, unit: "vials", costPerUnit: 750, totalCost: 2250, supplier: "Biological Agro Labs", alertLevel: 1, status: "ADEQUATE", lastUpdated: "2026-08-01" },
];

// Seed Manual Stock Valuations for P&L Statements
let mockStockValuations: ManualStockValuationItem[] = [
  { id: "sv-1", periodName: "FY 2026-27 (Current)", fromDate: "2026-04-01", toDate: "2027-03-31", openingStock: 450000, closingStock: 680000, createdAt: "2026-04-01" },
  { id: "sv-2", periodName: "FY 2025-26 (Past Year)", fromDate: "2025-04-01", toDate: "2026-03-31", openingStock: 320000, closingStock: 450000, createdAt: "2025-04-01" },
];

function calculateItemStatus(closing: number, alertLevel: number): "ADEQUATE" | "LOW_STOCK" | "OUT_OF_STOCK" {
  if (closing <= 0) return "OUT_OF_STOCK";
  if (closing <= alertLevel) return "LOW_STOCK";
  return "ADEQUATE";
}

export function getInventory(type: InventoryType): StockInventoryItem[] {
  let list: StockInventoryItem[] = [];
  if (type === "feed") list = mockFeedInventory;
  else if (type === "medicine") list = mockMedicineInventory;
  else if (type === "vaccine") list = mockVaccineInventory;

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

export function getAllInventoryAlerts() {
  const all = [
    ...getInventory("feed"),
    ...getInventory("medicine"),
    ...getInventory("vaccine"),
  ];
  return all.filter((item) => item.status === "LOW_STOCK" || item.status === "OUT_OF_STOCK");
}

export function updateInventoryRecord(type: InventoryType, id: string, payload: { usedQty?: number; wastageQty?: number; alertLevel?: number; costPerUnit?: number }) {
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

  if (type === "feed") mockFeedInventory = updater(mockFeedInventory);
  else if (type === "medicine") mockMedicineInventory = updater(mockMedicineInventory);
  else if (type === "vaccine") mockVaccineInventory = updater(mockVaccineInventory);

  return getInventory(type).find((i) => i.id === id);
}

// =================== STOCK VALUATIONS ===================
export function getStockValuations(): ManualStockValuationItem[] {
  return mockStockValuations;
}

export function createStockValuation(data: Omit<ManualStockValuationItem, "id" | "createdAt">): ManualStockValuationItem {
  const newRecord: ManualStockValuationItem = {
    ...data,
    id: `sv_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockStockValuations.unshift(newRecord);
  return newRecord;
}

export function updateStockValuation(id: string, data: Partial<ManualStockValuationItem>) {
  mockStockValuations = mockStockValuations.map((v) => (v.id === id ? { ...v, ...data } : v));
  return mockStockValuations.find((v) => v.id === id);
}

export function deleteStockValuation(id: string): boolean {
  mockStockValuations = mockStockValuations.filter((v) => v.id !== id);
  return true;
}

export function resetInventoryData() {
  mockFeedInventory = [];
  mockMedicineInventory = [];
  mockVaccineInventory = [];
  mockStockValuations = [];
}
