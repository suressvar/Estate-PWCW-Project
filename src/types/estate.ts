// Machine Consumption Rates (Liters per hour) - client and server safe
export const MACHINE_RATES: Record<string, number> = {
  "John Deere Tractor": 4.5,
  "VST Tillers": 2.0,
  "Rotavator": 3.5,
  "Water Pump Generator": 1.5,
};

// Master Data Types
export interface PlotItem {
  id: string;
  name: string;
  location: string;
  areaAcres: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export interface CropItem {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}

export interface PlotCropAssociation {
  id: string;
  plotId: string;
  plotName: string;
  cropActivityId: string;
  cropActivityName: string;
  startDate: string;
  endDate?: string;
  status: "ACTIVE" | "COMPLETED";
}

// Transaction Logs Types
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
  paymentMode?: "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit / On Account" | string;
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL";
  referenceNo?: string;
  ratePerKg?: number;
}

export const DEFAULT_PURCHASE_CATEGORIES = [
  "Fertilizer & Nutrition",
  "Diesel & Fuel",
  "Machinery Spares & Repairs",
  "Irrigation & Piping",
  "Seeds & Saplings",
  "Pesticides & Bio",
  "Tools & Hardware",
  "General Estate Supplies",
];

export interface PurchaseVoucherItem extends BaseLog {
  voucherNo: string;
  category: string;
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
  voucherType?: string;
  supplierName?: string;
  billNo?: string;
}

export type GeneralPurchaseLogItem = PurchaseVoucherItem;

export type { GodownItem, GodownStockMovement } from "@/lib/db-storage";
