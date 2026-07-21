// Transaction Logs In-Memory Storage & Interfaces

export interface BaseLog {
  id: string;
  plotCropId?: string;
  plotName?: string;
  cropActivityName?: string;
  date: string;
  loggedBy: string;
  createdAt: string;
  notes?: string;
}

export interface FertilizerLogItem extends BaseLog {
  transactionType: "PURCHASE" | "CONSUMPTION";
  fertilizerName: string;
  quantityKg: number;
  cost: number;
}

export interface DieselLogItem extends BaseLog {
  transactionType: "PURCHASE" | "CONSUMPTION";
  quantityLiters: number;
  cost: number;
}

export interface MachineryLogItem extends BaseLog {
  machineName: string;
  startTime: string;
  endTime: string;
  runningHours: number;
  dieselConsumedLiters: number;
}

export interface LaborLogItem extends BaseLog {
  menCount: number;
  womenCount: number;
  menWageRate: number;
  womenWageRate: number;
  totalCost: number;
}

export interface ProductionLogItem extends BaseLog {
  quantityKg: number;
}

export interface SalesLogItem extends BaseLog {
  quantityKg: number;
  value: number;
  buyerName?: string;
}

export interface GeneralPurchaseLogItem extends BaseLog {
  description: string;
  cost: number;
}

// Stores with initial seed entries for computed aggregation
let fertilizerLogs: FertilizerLogItem[] = [
  { id: "f1", plotName: "Plot A - North Field", cropActivityName: "Tomato", transactionType: "PURCHASE", fertilizerName: "NPK 19-19-19", quantityKg: 1000, cost: 45000, date: "2026-06-01", loggedBy: "Estate Admin", createdAt: "2026-06-01T10:00:00Z" },
  { id: "f2", plotName: "Plot A - North Field", cropActivityName: "Tomato", transactionType: "CONSUMPTION", fertilizerName: "NPK 19-19-19", quantityKg: 350, cost: 15750, date: "2026-06-15", loggedBy: "Field Staff", createdAt: "2026-06-15T10:00:00Z" },
  { id: "f3", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", transactionType: "CONSUMPTION", fertilizerName: "Urea", quantityKg: 200, cost: 9000, date: "2026-07-01", loggedBy: "Field Staff", createdAt: "2026-07-01T10:00:00Z" },
];

let dieselLogs: DieselLogItem[] = [
  { id: "d1", transactionType: "PURCHASE", quantityLiters: 1000, cost: 95000, date: "2026-06-01", loggedBy: "Estate Admin", createdAt: "2026-06-01T10:00:00Z" },
  { id: "d2", transactionType: "CONSUMPTION", quantityLiters: 400, cost: 38000, date: "2026-06-10", loggedBy: "Field Staff", createdAt: "2026-06-10T10:00:00Z" },
  { id: "d3", transactionType: "CONSUMPTION", quantityLiters: 150, cost: 14250, date: "2026-07-10", loggedBy: "Field Staff", createdAt: "2026-07-10T10:00:00Z" },
];

let machineryLogs: MachineryLogItem[] = [
  { id: "m1", plotName: "Plot A - North Field", cropActivityName: "Tomato", machineName: "John Deere Tractor", startTime: "08:00", endTime: "14:00", runningHours: 6, dieselConsumedLiters: 27, date: "2026-07-10", loggedBy: "Field Staff", createdAt: "2026-07-10T10:00:00Z" },
  { id: "m2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", machineName: "VST Tillers", startTime: "09:00", endTime: "14:00", runningHours: 5, dieselConsumedLiters: 10, date: "2026-07-12", loggedBy: "Field Staff", createdAt: "2026-07-12T10:00:00Z" },
];

let laborLogs: LaborLogItem[] = [
  { id: "l1", plotName: "Plot A - North Field", cropActivityName: "Tomato", menCount: 4, womenCount: 6, menWageRate: 600, womenWageRate: 450, totalCost: 5100, date: "2026-07-15", loggedBy: "Field Staff", createdAt: "2026-07-15T10:00:00Z" },
  { id: "l2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", menCount: 3, womenCount: 4, menWageRate: 600, womenWageRate: 450, totalCost: 3600, date: "2026-07-18", loggedBy: "Field Staff", createdAt: "2026-07-18T10:00:00Z" },
];

let productionLogs: ProductionLogItem[] = [
  { id: "pr1", plotName: "Plot A - North Field", cropActivityName: "Tomato", quantityKg: 2500, date: "2026-07-15", loggedBy: "Field Staff", createdAt: "2026-07-15T10:00:00Z" },
  { id: "pr2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", quantityKg: 1800, date: "2026-07-18", loggedBy: "Field Staff", createdAt: "2026-07-18T10:00:00Z" },
];

let salesLogs: SalesLogItem[] = [
  { id: "s1", plotName: "Plot A - North Field", cropActivityName: "Tomato", quantityKg: 2000, value: 120000, buyerName: "Koyambedu Mandi", date: "2026-07-16", loggedBy: "Estate Admin", createdAt: "2026-07-16T10:00:00Z" },
  { id: "s2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", quantityKg: 1500, value: 75000, buyerName: "Direct Local Wholesaler", date: "2026-07-19", loggedBy: "Estate Admin", createdAt: "2026-07-19T10:00:00Z" },
];

let generalPurchaseLogs: GeneralPurchaseLogItem[] = [
  { id: "g1", plotName: "Plot A - North Field", cropActivityName: "Tomato", description: "Drip Irrigation Valve Spares", cost: 6500, date: "2026-07-05", loggedBy: "Estate Admin", createdAt: "2026-07-05T10:00:00Z" },
];

export function resetLogsForTesting() {
  fertilizerLogs = [];
  dieselLogs = [];
  machineryLogs = [];
  laborLogs = [];
  productionLogs = [];
  salesLogs = [];
  generalPurchaseLogs = [];
}


// Machine Consumption Rates (Liters per hour)
export const MACHINE_RATES: Record<string, number> = {
  "John Deere Tractor": 4.5,
  "VST Tillers": 2.0,
  "Rotavator": 3.5,
  "Water Pump Generator": 1.5,
};

export function getFertilizerLogs() { return fertilizerLogs; }
export function addFertilizerLog(data: Omit<FertilizerLogItem, "id" | "createdAt">) {
  const item: FertilizerLogItem = { ...data, id: `fert_${Date.now()}`, createdAt: new Date().toISOString() };
  fertilizerLogs.unshift(item);
  return item;
}

export function getDieselLogs() { return dieselLogs; }
export function addDieselLog(data: Omit<DieselLogItem, "id" | "createdAt">) {
  const item: DieselLogItem = { ...data, id: `diesel_${Date.now()}`, createdAt: new Date().toISOString() };
  dieselLogs.unshift(item);
  return item;
}

export function getMachineryLogs() { return machineryLogs; }
export function addMachineryLog(data: Omit<MachineryLogItem, "id" | "createdAt">) {
  const item: MachineryLogItem = { ...data, id: `mach_${Date.now()}`, createdAt: new Date().toISOString() };
  machineryLogs.unshift(item);
  return item;
}

export function getLaborLogs() { return laborLogs; }
export function addLaborLog(data: Omit<LaborLogItem, "id" | "createdAt">) {
  const item: LaborLogItem = { ...data, id: `labor_${Date.now()}`, createdAt: new Date().toISOString() };
  laborLogs.unshift(item);
  return item;
}

export function getProductionLogs() { return productionLogs; }
export function addProductionLog(data: Omit<ProductionLogItem, "id" | "createdAt">) {
  const item: ProductionLogItem = { ...data, id: `prod_${Date.now()}`, createdAt: new Date().toISOString() };
  productionLogs.unshift(item);
  return item;
}

export function getSalesLogs() { return salesLogs; }
export function addSalesLog(data: Omit<SalesLogItem, "id" | "createdAt">) {
  const item: SalesLogItem = { ...data, id: `sales_${Date.now()}`, createdAt: new Date().toISOString() };
  salesLogs.unshift(item);
  return item;
}

export function getGeneralPurchaseLogs() { return generalPurchaseLogs; }
export function addGeneralPurchaseLog(data: Omit<GeneralPurchaseLogItem, "id" | "createdAt">) {
  const item: GeneralPurchaseLogItem = { ...data, id: `gen_${Date.now()}`, createdAt: new Date().toISOString() };
  generalPurchaseLogs.unshift(item);
  return item;
}
