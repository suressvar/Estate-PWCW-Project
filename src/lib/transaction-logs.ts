// Transaction Logs & Voucher Storage & Interfaces

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

export interface VoucherLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  amount: number;
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
  voucherNo?: string;
  voucherType?: string;
  quantityKg: number;
  value: number;
  buyerName?: string;
  buyerContact?: string;
  buyerAddress?: string;
  items?: VoucherLineItem[];
  subtotal?: number;
  taxPercent?: number;
  taxAmount?: number;
  discount?: number;
  paymentMode?: "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit / On Account";
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL";
  referenceNo?: string;
}

export interface PurchaseVoucherItem extends BaseLog {
  voucherNo: string;
  category: "Fertilizer & Nutrition" | "Diesel & Fuel" | "Machinery Spares & Repairs" | "Irrigation & Piping" | "Seeds & Saplings" | "Pesticides & Bio" | "Tools & Hardware" | "General Estate Supplies";
  vendorName: string;
  vendorBillNo?: string;
  vendorContact?: string;
  vendorGstin?: string;
  description: string;
  items?: VoucherLineItem[];
  subtotal: number;
  taxPercent?: number;
  taxAmount?: number;
  discount?: number;
  cost: number;
  paymentMode?: "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit";
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL";
}

export type GeneralPurchaseLogItem = PurchaseVoucherItem;

// Stores with initial seed entries for computed aggregation & vouchers
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
  {
    id: "s1",
    voucherNo: "SLS-VCH-2026-001",
    voucherType: "Harvest Crop Sale",
    plotName: "Plot A - North Field",
    cropActivityName: "Tomato",
    quantityKg: 2000,
    value: 120000,
    buyerName: "Koyambedu Mandi",
    buyerContact: "+91 98401 23456",
    buyerAddress: "Wholesale Mandi Complex, Chennai",
    subtotal: 120000,
    taxPercent: 0,
    taxAmount: 0,
    discount: 0,
    paymentMode: "Bank Transfer",
    paymentStatus: "PAID",
    referenceNo: "NEFT-HDFC-992384",
    items: [
      { id: "i1", description: "Grade A Hybrid Tomatoes", quantity: 1500, unit: "kg", rate: 65, amount: 97500 },
      { id: "i2", description: "Grade B Standard Tomatoes", quantity: 500, unit: "kg", rate: 45, amount: 22500 },
    ],
    date: "2026-07-16",
    loggedBy: "Estate Admin",
    notes: "Direct wholesale dispatch via truck TN-22-AX-8910",
    createdAt: "2026-07-16T10:00:00Z",
  },
  {
    id: "s2",
    voucherNo: "SLS-VCH-2026-002",
    voucherType: "Direct Mandi Sale",
    plotName: "Plot B - Coconut Grove",
    cropActivityName: "Coconut",
    quantityKg: 1500,
    value: 75000,
    buyerName: "Direct Local Wholesaler",
    buyerContact: "+91 94440 88712",
    buyerAddress: "Pollachi Coconut Market",
    subtotal: 75000,
    taxPercent: 0,
    taxAmount: 0,
    discount: 0,
    paymentMode: "UPI / QR",
    paymentStatus: "PAID",
    referenceNo: "UPI-429981023",
    items: [
      { id: "i3", description: "Matured De-husked Coconuts (Large)", quantity: 1500, unit: "pieces", rate: 50, amount: 75000 },
    ],
    date: "2026-07-19",
    loggedBy: "Estate Admin",
    notes: "Batch harvest payment settled via GPay QR",
    createdAt: "2026-07-19T10:00:00Z",
  },
];

let generalPurchaseLogs: PurchaseVoucherItem[] = [
  {
    id: "g1",
    voucherNo: "PUR-VCH-2026-001",
    category: "Irrigation & Piping",
    plotName: "Plot A - North Field",
    cropActivityName: "Tomato",
    description: "Drip Irrigation Valve Spares & Lateral Pipes",
    vendorName: "Kavery Drip & Hardware Enterprises",
    vendorBillNo: "KD-INV-8891",
    vendorContact: "+91 97890 11223",
    vendorGstin: "33AABCK8921F1ZX",
    items: [
      { id: "pi1", description: "16mm Drip Lateral Line (500m Coil)", quantity: 2, unit: "coils", rate: 2200, amount: 4400 },
      { id: "pi2", description: "Screen Filter 2-inch Flushing Valves", quantity: 3, unit: "pieces", rate: 700, amount: 2100 },
    ],
    subtotal: 6500,
    taxPercent: 0,
    taxAmount: 0,
    discount: 0,
    cost: 6500,
    paymentMode: "Bank Transfer",
    paymentStatus: "PAID",
    date: "2026-07-05",
    loggedBy: "Estate Admin",
    notes: "Replaced damaged drip laterals in North sector block",
    createdAt: "2026-07-05T10:00:00Z",
  },
  {
    id: "g2",
    voucherNo: "PUR-VCH-2026-002",
    category: "Fertilizer & Nutrition",
    plotName: "Plot A - North Field",
    cropActivityName: "Tomato",
    description: "Organic Compost & Micronutrient Foliar Spray",
    vendorName: "Sri Murugan Agro Agencies",
    vendorBillNo: "SMA-90214",
    vendorContact: "+91 98412 55678",
    vendorGstin: "33AAMFS4431E1Z8",
    items: [
      { id: "pi3", description: "Vermicompost Enricher (50kg Bag)", quantity: 10, unit: "bags", rate: 450, amount: 4500 },
      { id: "pi4", description: "Bio-Chelated Micronutrient Spray (5L)", quantity: 2, unit: "cans", rate: 1200, amount: 2400 },
    ],
    subtotal: 6900,
    taxPercent: 0,
    taxAmount: 0,
    discount: 0,
    cost: 6900,
    paymentMode: "UPI / QR",
    paymentStatus: "PAID",
    date: "2026-07-08",
    loggedBy: "Estate Admin",
    notes: "Applied before secondary flowering cycle",
    createdAt: "2026-07-08T10:00:00Z",
  },
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
  const currentCount = salesLogs.length + 1;
  const voucherNo = data.voucherNo || `SLS-VCH-2026-${String(currentCount).padStart(3, "0")}`;
  const item: SalesLogItem = {
    ...data,
    id: `sales_${Date.now()}`,
    voucherNo,
    subtotal: data.subtotal ?? data.value,
    createdAt: new Date().toISOString(),
  };
  salesLogs.unshift(item);
  return item;
}

export function deleteSalesLog(id: string) {
  salesLogs = salesLogs.filter((s) => s.id !== id);
  return true;
}

export function getGeneralPurchaseLogs() { return generalPurchaseLogs; }
export function addGeneralPurchaseLog(data: Omit<PurchaseVoucherItem, "id" | "createdAt">) {
  const currentCount = generalPurchaseLogs.length + 1;
  const voucherNo = data.voucherNo || `PUR-VCH-2026-${String(currentCount).padStart(3, "0")}`;
  const item: PurchaseVoucherItem = {
    ...data,
    id: `gen_${Date.now()}`,
    voucherNo,
    subtotal: data.subtotal ?? data.cost,
    createdAt: new Date().toISOString(),
  };
  generalPurchaseLogs.unshift(item);
  return item;
}

export function deleteGeneralPurchaseLog(id: string) {
  generalPurchaseLogs = generalPurchaseLogs.filter((g) => g.id !== id);
  return true;
}

export function resetTransactionLogs() {
  fertilizerLogs = [];
  dieselLogs = [];
  machineryLogs = [];
  laborLogs = [];
  productionLogs = [];
  salesLogs = [];
  generalPurchaseLogs = [];
}
