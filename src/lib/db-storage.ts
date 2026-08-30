import fs from "node:fs";
import path from "node:path";

// Master Data Types
export interface PlotItem {
  id: string;
  name: string;
  location: string;
  areaAcres: number;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
}

export const DEFAULT_CROP_CATEGORIES = [
  "CROP",
  "ACTIVITY",
  "FRUIT CROPS",
  "VEGETABLES",
  "TIMBER & TREES",
  "FODDER CROPS",
  "INTER-CROP",
  "FIELD ACTIVITY",
  "IRRIGATION & WATER",
  "SOIL & FERTILIZATION",
];

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
  paymentMode?: "Cash" | "Bank Transfer" | "UPI / QR" | "Cheque" | "Credit / On Account";
  paymentStatus?: "PAID" | "PENDING" | "PARTIAL";
  referenceNo?: string;
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
}

export type GeneralPurchaseLogItem = PurchaseVoucherItem;

// HR Data Types
export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "RESIGNED";
export type WageType = "DAILY" | "MONTHLY" | "HOURLY";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
export type WageStatus = "PENDING" | "PAID";
export type LeaveType = "CASUAL" | "SICK" | "EMERGENCY" | "UNPAID";
export type LeaveStatus = "APPROVED" | "PENDING" | "REJECTED";

export interface EmployeeRoleItem {
  id: string;
  roleName: string;
  description?: string;
}

export interface EmployeeItem {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  roleId?: string;
  roleName?: string;
  joinDate?: string;
  wageType: WageType;
  wageRate: number;
  status: EmployeeStatus;
  notes?: string;
  photoPath?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  aadhaarNo?: string;
  bankAccountNo?: string;
  bankName?: string;
  ifscCode?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface WageRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  roleName?: string;
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  wageRate: number;
  wageType: WageType;
  grossSalary: number;
  deductions: number;
  bonus: number;
  netSalary: number;
  paymentDate?: string;
  paymentMode?: string;
  paymentReference?: string;
  status: WageStatus;
  notes?: string;
  calculatedAt: string;
}

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  appliedDate: string;
  notes?: string;
}

// Voucher Types
export interface ExpenseUnit {
  id: string;
  unitName: string;
  unitSymbol: string;
}

export interface FeedPurchase {
  id: string;
  feedName: string;
  quantity: number;
  unit: string;
  cost: number;
  purchaseDate: string;
  billDate?: string;
  billNo?: string;
  supplier?: string;
  ledgerId?: string;
  particularName?: string;
  pnlCategory: string;
  notes?: string;
  createdAt: string;
}

export interface MedicinePurchase {
  id: string;
  medicineName: string;
  doseUnit?: string;
  quantity: number;
  cost: number;
  purchaseDate: string;
  billDate?: string;
  billNo?: string;
  supplier?: string;
  ledgerId?: string;
  particularName?: string;
  pnlCategory: string;
  notes?: string;
  createdAt: string;
}

export interface VaccinePurchase {
  id: string;
  vaccineName: string;
  quantity: number;
  cost: number;
  purchaseDate: string;
  billDate?: string;
  billNo?: string;
  supplier?: string;
  ledgerId?: string;
  particularName?: string;
  pnlCategory: string;
  notes?: string;
  createdAt: string;
}

export interface OtherVoucher {
  id: string;
  voucherDate: string;
  supplierName?: string;
  ledgerId?: string;
  particularName?: string;
  billDate?: string;
  billNo?: string;
  quantity?: number;
  unitName?: string;
  amount: number;
  notes?: string;
  pnlCategory: string;
  createdAt: string;
}

// Sales Types
export interface OtherSaleItem {
  id: string;
  srNo: string;
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalAmount: number;
  dateOfSale: string;
  buyerName: string;
  buyerCity?: string;
  buyerContact?: string;
  ledgerId?: string;
  particularName?: string;
  category?: string;
  pnlCategory: string;
  notes?: string;
  invoiceGroupId?: string;
  createdAt: string;
}

// Inventory Types
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

// Accounting Types
export const DEFAULT_GROUP_TYPES = ["EXPENSE", "INCOME", "ASSET", "LIABILITY"];
export type GroupType = string;
export type PnLSide = "DEBIT" | "CREDIT";

export interface LedgerGroupItem {
  id: string;
  groupName: string;
  description: string;
  groupType: GroupType;
  pnlSide: PnLSide;
  linkedCategory?: string;
  createdAt: string;
}

export interface ExpenseLedgerItem {
  id: string;
  ledgerName: string;
  groupId: string;
  groupName?: string;
  groupType?: GroupType;
  description?: string;
  createdAt: string;
}

export interface GodownItem {
  id: string;
  name: string;
  category: string;
  sourceVoucherId?: string;
  sourceVoucherNo?: string;
  vendorName?: string;
  receivedDate: string;
  totalReceivedQuantity: number;
  availableQuantity: number;
  unit: string;
  ratePerUnit: number;
  totalValue: number;
  location: string;
  minStockAlert: number;
  status: "IN_STOCK" | "LOW_STOCK" | "EXHAUSTED";
  notes?: string;
  createdAt: string;
  lastUpdated: string;
}

export interface GodownStockMovement {
  id: string;
  godownItemId: string;
  itemName: string;
  category: string;
  movementType: "INWARD_PURCHASE" | "ISSUE_TO_MENU" | "ADJUSTMENT";
  quantity: number;
  unit: string;
  ratePerUnit: number;
  totalCost: number;
  source: string;
  destinationMenu?: string;
  destinationRoute?: string;
  plotId?: string;
  plotName?: string;
  cropActivityId?: string;
  cropActivityName?: string;
  issuedTo?: string;
  date: string;
  notes?: string;
  createdAt: string;
}

// Complete Database Schema
export interface EstateDatabase {
  plots: PlotItem[];
  crops: CropItem[];
  plotCrops: PlotCropAssociation[];
  fertilizerLogs: FertilizerLogItem[];
  dieselLogs: DieselLogItem[];
  machineryLogs: MachineryLogItem[];
  laborLogs: LaborLogItem[];
  productionLogs: ProductionLogItem[];
  salesLogs: SalesLogItem[];
  generalPurchaseLogs: GeneralPurchaseLogItem[];
  employeeRoles: EmployeeRoleItem[];
  employees: EmployeeItem[];
  attendance: AttendanceRecord[];
  wages: WageRecord[];
  leaves: LeaveRecord[];
  expenseUnits: ExpenseUnit[];
  feedPurchases: FeedPurchase[];
  medicinePurchases: MedicinePurchase[];
  vaccinePurchases: VaccinePurchase[];
  otherVouchers: OtherVoucher[];
  otherSales: OtherSaleItem[];
  feedInventory: StockInventoryItem[];
  medicineInventory: StockInventoryItem[];
  vaccineInventory: StockInventoryItem[];
  stockValuations: ManualStockValuationItem[];
  ledgerGroups: LedgerGroupItem[];
  expenseLedgers: ExpenseLedgerItem[];
  godownItems?: GodownItem[];
  godownMovements?: GodownStockMovement[];
  cropCategories?: string[];
  groupTypes?: string[];
  purchaseCategories?: string[];
  salesCategories?: string[];
}

export const DEFAULT_SALES_CATEGORIES: string[] = [
  "Vegetables & Greens",
  "Fruits & Orchards",
  "Coconut & Copra",
  "Organic Compost & Vermicompost",
  "Crop Produce",
  "General Estate Sales",
];

export const DEFAULT_UNITS: ExpenseUnit[] = [
  { id: "u-1", unitName: "Bags", unitSymbol: "Bags" },
  { id: "u-2", unitName: "Boxes", unitSymbol: "Box" },
  { id: "u-3", unitName: "Bundles", unitSymbol: "Bnd" },
  { id: "u-4", unitName: "Dose", unitSymbol: "Dos" },
  { id: "u-5", unitName: "Grams", unitSymbol: "g" },
  { id: "u-6", unitName: "KG", unitSymbol: "KG" },
  { id: "u-7", unitName: "Litres", unitSymbol: "L" },
  { id: "u-8", unitName: "ML", unitSymbol: "ml" },
  { id: "u-9", unitName: "Meters", unitSymbol: "m" },
  { id: "u-10", unitName: "Nos", unitSymbol: "Nos" },
  { id: "u-11", unitName: "Packets", unitSymbol: "Pkts" },
  { id: "u-12", unitName: "Pairs", unitSymbol: "Pr" },
  { id: "u-13", unitName: "Pieces", unitSymbol: "Pcs" },
  { id: "u-14", unitName: "Rolls", unitSymbol: "Rll" },
  { id: "u-15", unitName: "Sets", unitSymbol: "Sets" },
  { id: "u-16", unitName: "Tons", unitSymbol: "T" },
];

const defaultSeedData: EstateDatabase = {
  cropCategories: [...DEFAULT_CROP_CATEGORIES],
  groupTypes: [...DEFAULT_GROUP_TYPES],
  purchaseCategories: [...DEFAULT_PURCHASE_CATEGORIES],
  salesCategories: [...DEFAULT_SALES_CATEGORIES],
  plots: [
    { id: "p1", name: "Plot A - North Field", location: "North Sector", areaAcres: 12.5, status: "ACTIVE", createdAt: "2026-01-10" },
    { id: "p2", name: "Plot B - Coconut Grove", location: "East Sector", areaAcres: 8.0, status: "ACTIVE", createdAt: "2026-01-12" },
    { id: "p3", name: "Plot C - South Pasture", location: "South Sector", areaAcres: 15.2, status: "INACTIVE", createdAt: "2026-02-01" },
  ],
  crops: [
    { id: "c1", name: "Tomato", type: "CROP", createdAt: "2026-01-05" },
    { id: "c2", name: "Coconut", type: "CROP", createdAt: "2026-01-05" },
    { id: "c3", name: "Fertilizer Application", type: "ACTIVITY", createdAt: "2026-01-15" },
    { id: "c4", name: "Weeding & Tying", type: "ACTIVITY", createdAt: "2026-01-20" },
  ],
  plotCrops: [
    { id: "pc1", plotId: "p1", plotName: "Plot A - North Field", cropActivityId: "c1", cropActivityName: "Tomato", startDate: "2026-06-01", status: "ACTIVE" },
    { id: "pc2", plotId: "p1", plotName: "Plot A - North Field", cropActivityId: "c3", cropActivityName: "Fertilizer Application", startDate: "2026-06-15", status: "ACTIVE" },
    { id: "pc3", plotId: "p2", plotName: "Plot B - Coconut Grove", cropActivityId: "c2", cropActivityName: "Coconut", startDate: "2026-01-01", status: "ACTIVE" },
  ],
  fertilizerLogs: [
    { id: "f1", plotName: "Plot A - North Field", cropActivityName: "Tomato", transactionType: "PURCHASE", fertilizerName: "NPK 19-19-19", quantityKg: 1000, cost: 45000, date: "2026-06-01", loggedBy: "Estate Admin", createdAt: "2026-06-01T10:00:00Z" },
    { id: "f2", plotName: "Plot A - North Field", cropActivityName: "Tomato", transactionType: "CONSUMPTION", fertilizerName: "NPK 19-19-19", quantityKg: 350, cost: 15750, date: "2026-06-15", loggedBy: "Field Staff", createdAt: "2026-06-15T10:00:00Z" },
    { id: "f3", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", transactionType: "CONSUMPTION", fertilizerName: "Urea", quantityKg: 200, cost: 9000, date: "2026-07-01", loggedBy: "Field Staff", createdAt: "2026-07-01T10:00:00Z" },
  ],
  dieselLogs: [
    { id: "d1", transactionType: "PURCHASE", quantityLiters: 1000, cost: 95000, date: "2026-06-01", loggedBy: "Estate Admin", createdAt: "2026-06-01T10:00:00Z" },
    { id: "d2", transactionType: "CONSUMPTION", quantityLiters: 400, cost: 38000, date: "2026-06-10", loggedBy: "Field Staff", createdAt: "2026-06-10T10:00:00Z" },
    { id: "d3", transactionType: "CONSUMPTION", quantityLiters: 150, cost: 14250, date: "2026-07-10", loggedBy: "Field Staff", createdAt: "2026-07-10T10:00:00Z" },
  ],
  machineryLogs: [
    { id: "m1", plotName: "Plot A - North Field", cropActivityName: "Tomato", machineName: "John Deere Tractor", startTime: "08:00", endTime: "14:00", runningHours: 6, dieselConsumedLiters: 27, date: "2026-07-10", loggedBy: "Field Staff", createdAt: "2026-07-10T10:00:00Z" },
    { id: "m2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", machineName: "VST Tillers", startTime: "09:00", endTime: "14:00", runningHours: 5, dieselConsumedLiters: 10, date: "2026-07-12", loggedBy: "Field Staff", createdAt: "2026-07-12T10:00:00Z" },
  ],
  laborLogs: [
    { id: "l1", plotName: "Plot A - North Field", cropActivityName: "Tomato", menCount: 4, womenCount: 6, menWageRate: 600, womenWageRate: 450, totalCost: 5100, date: "2026-07-15", loggedBy: "Field Staff", createdAt: "2026-07-15T10:00:00Z" },
    { id: "l2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", menCount: 3, womenCount: 4, menWageRate: 600, womenWageRate: 450, totalCost: 3600, date: "2026-07-18", loggedBy: "Field Staff", createdAt: "2026-07-18T10:00:00Z" },
  ],
  productionLogs: [
    { id: "pr1", plotName: "Plot A - North Field", cropActivityName: "Tomato", quantityKg: 2500, date: "2026-07-15", loggedBy: "Field Staff", createdAt: "2026-07-15T10:00:00Z" },
    { id: "pr2", plotName: "Plot B - Coconut Grove", cropActivityName: "Coconut", quantityKg: 1800, date: "2026-07-18", loggedBy: "Field Staff", createdAt: "2026-07-18T10:00:00Z" },
  ],
  salesLogs: [],
  generalPurchaseLogs: [
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
      notes: "",
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
      notes: "",
      createdAt: "2026-07-08T10:00:00Z",
    },
  ],
  employeeRoles: [
    { id: "er-1", roleName: "PWCW Worker", description: "" },
    { id: "er-2", roleName: "Supervisor", description: "" },
    { id: "er-3", roleName: "Driver & Equipment Operator", description: "" },
    { id: "er-4", roleName: "Veterinary Assistant", description: "" },
    { id: "er-5", roleName: "Security Guard", description: "" },
    { id: "er-6", roleName: "Admin & Accounts Staff", description: "" },
    { id: "er-7", roleName: "Estate Manager", description: "" },
  ],
  employees: [
    { id: "emp-1", name: "Murugan K.", phone: "+91 98421 22334", address: "North Colony, Estate Quarters", roleId: "er-1", roleName: "PWCW Worker", joinDate: "2024-03-01", wageType: "DAILY", wageRate: 550, status: "ACTIVE", notes: "", emergencyContact: "Selvi M. (Wife)", emergencyPhone: "+91 98421 22335", aadhaarNo: "XXXX-XXXX-4819", bankAccountNo: "330910123847", bankName: "State Bank of India", ifscCode: "SBIN0001234", createdAt: "2024-03-01" },
    { id: "emp-2", name: "Selvi Murugan", phone: "+91 98421 22335", address: "North Colony, Estate Quarters", roleId: "er-1", roleName: "PWCW Worker", joinDate: "2024-03-01", wageType: "DAILY", wageRate: 450, status: "ACTIVE", notes: "", emergencyContact: "Murugan K. (Husband)", emergencyPhone: "+91 98421 22334", aadhaarNo: "XXXX-XXXX-9122", bankAccountNo: "330910123848", bankName: "State Bank of India", ifscCode: "SBIN0001234", createdAt: "2024-03-01" },
    { id: "emp-3", name: "Ramasamy V.", phone: "+91 97890 33445", address: "South Gate Quarters", roleId: "er-3", roleName: "Driver & Equipment Operator", joinDate: "2024-05-15", wageType: "DAILY", wageRate: 650, status: "ACTIVE", notes: "", emergencyContact: "Kavitha R.", emergencyPhone: "+91 97890 33446", aadhaarNo: "XXXX-XXXX-5512", bankAccountNo: "910283746192", bankName: "Canara Bank", ifscCode: "CNRB0002345", createdAt: "2024-05-15" },
    { id: "emp-4", name: "Kuppusamy M.", phone: "+91 94432 88776", address: "East Enclave", roleId: "er-2", roleName: "Supervisor", joinDate: "2023-11-01", wageType: "MONTHLY", wageRate: 22000, status: "ACTIVE", notes: "", emergencyContact: "Meena K.", emergencyPhone: "+91 94432 88777", aadhaarNo: "XXXX-XXXX-7731", bankAccountNo: "449018237461", bankName: "Indian Overseas Bank", ifscCode: "IOBA0003456", createdAt: "2023-11-01" },
    { id: "emp-5", name: "Ganesan P.", phone: "+91 93601 55667", address: "Main Gate Cottage", roleId: "er-5", roleName: "Security Guard", joinDate: "2025-01-10", wageType: "MONTHLY", wageRate: 15000, status: "ACTIVE", notes: "", emergencyContact: "Latha G.", emergencyPhone: "+91 93601 55668", aadhaarNo: "XXXX-XXXX-8821", bankAccountNo: "550192837465", bankName: "HDFC Bank", ifscCode: "HDFC0004567", createdAt: "2025-01-10" },
  ],
  attendance: [
    { id: "att-1", employeeId: "emp-1", employeeName: "Murugan K.", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "07:00", checkOutTime: "17:00", notes: "", recordedBy: "Kuppusamy M.", createdAt: "2026-08-01T07:00:00Z" },
    { id: "att-2", employeeId: "emp-2", employeeName: "Selvi Murugan", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "07:30", checkOutTime: "16:30", notes: "", recordedBy: "Kuppusamy M.", createdAt: "2026-08-01T07:30:00Z" },
    { id: "att-3", employeeId: "emp-3", employeeName: "Ramasamy V.", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "08:00", checkOutTime: "18:00", notes: "", recordedBy: "Kuppusamy M.", createdAt: "2026-08-01T08:00:00Z" },
    { id: "att-4", employeeId: "emp-4", employeeName: "Kuppusamy M.", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "06:30", checkOutTime: "18:30", notes: "", recordedBy: "Estate Admin", createdAt: "2026-08-01T06:30:00Z" },
    { id: "att-5", employeeId: "emp-5", employeeName: "Ganesan P.", attendanceDate: "2026-08-01", status: "PRESENT", checkInTime: "18:00", checkOutTime: "06:00", notes: "", recordedBy: "Estate Admin", createdAt: "2026-08-01T18:00:00Z" },
  ],
  wages: [
    { id: "w-1", employeeId: "emp-1", employeeName: "Murugan K.", roleName: "PWCW Worker", month: 7, year: 2026, workingDays: 26, presentDays: 25, absentDays: 1, wageRate: 550, wageType: "DAILY", grossSalary: 13750, deductions: 250, bonus: 500, netSalary: 14000, status: "PAID", paymentDate: "2026-08-02", paymentMode: "Bank Transfer", paymentReference: "NEFT-SBIN-889123", calculatedAt: "2026-08-01" },
    { id: "w-2", employeeId: "emp-2", employeeName: "Selvi Murugan", roleName: "PWCW Worker", month: 7, year: 2026, workingDays: 26, presentDays: 24, absentDays: 2, wageRate: 450, wageType: "DAILY", grossSalary: 10800, deductions: 0, bonus: 200, netSalary: 11000, status: "PAID", paymentDate: "2026-08-02", paymentMode: "Bank Transfer", paymentReference: "NEFT-SBIN-889124", calculatedAt: "2026-08-01" },
    { id: "w-3", employeeId: "emp-3", employeeName: "Ramasamy V.", roleName: "Driver & Equipment Operator", month: 7, year: 2026, workingDays: 26, presentDays: 26, absentDays: 0, wageRate: 650, wageType: "DAILY", grossSalary: 16900, deductions: 0, bonus: 600, netSalary: 17500, status: "PAID", paymentDate: "2026-08-02", paymentMode: "Bank Transfer", paymentReference: "NEFT-CNRB-441290", calculatedAt: "2026-08-01" },
    { id: "w-4", employeeId: "emp-4", employeeName: "Kuppusamy M.", roleName: "Supervisor", month: 7, year: 2026, workingDays: 26, presentDays: 26, absentDays: 0, wageRate: 22000, wageType: "MONTHLY", grossSalary: 22000, deductions: 500, bonus: 1000, netSalary: 22500, status: "PAID", paymentDate: "2026-08-02", paymentMode: "Bank Transfer", paymentReference: "NEFT-IOBA-901823", calculatedAt: "2026-08-01" },
    { id: "w-5", employeeId: "emp-5", employeeName: "Ganesan P.", roleName: "Security Guard", month: 7, year: 2026, workingDays: 26, presentDays: 26, absentDays: 0, wageRate: 15000, wageType: "MONTHLY", grossSalary: 15000, deductions: 0, bonus: 0, netSalary: 15000, status: "PAID", paymentDate: "2026-08-02", paymentMode: "Bank Transfer", paymentReference: "NEFT-HDFC-220194", calculatedAt: "2026-08-01" },
  ],
  leaves: [
    { id: "lv-1", employeeId: "emp-1", employeeName: "Murugan K.", leaveType: "CASUAL", fromDate: "2026-07-14", toDate: "2026-07-14", totalDays: 1, reason: "Family village temple function", status: "APPROVED", approvedBy: "Kuppusamy M.", appliedDate: "2026-07-10" },
    { id: "lv-2", employeeId: "emp-2", employeeName: "Selvi Murugan", leaveType: "CASUAL", fromDate: "2026-07-14", toDate: "2026-07-15", totalDays: 2, reason: "Family function & personal work", status: "APPROVED", approvedBy: "Kuppusamy M.", appliedDate: "2026-07-10" },
  ],
  expenseUnits: [...DEFAULT_UNITS],
  feedPurchases: [
    { id: "fp-1", feedName: "Maize Silage Dry Bales", quantity: 50, unit: "bags", cost: 22500, purchaseDate: "2026-06-01", billDate: "2026-06-01", billNo: "FF-440", supplier: "Supreme Silage & Agro", ledgerId: "el-1", particularName: "Feed Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-06-01" },
    { id: "fp-2", feedName: "Organic High-Protein Nutrition Mash", quantity: 20, unit: "bags", cost: 28000, purchaseDate: "2026-06-20", billDate: "2026-06-20", billNo: "FF-512", supplier: "Supreme Silage & Agro", ledgerId: "el-1", particularName: "Feed Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-06-20" },
    { id: "fp-3", feedName: "Bio-Fertilizer & Soil Nutrient Mix", quantity: 10, unit: "nos", cost: 3500, purchaseDate: "2026-07-05", billDate: "2026-07-05", billNo: "MM-102", supplier: "AgriCare Supplies", ledgerId: "el-1", particularName: "Feed Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-07-05" },
  ],
  medicinePurchases: [
    { id: "mp-1", medicineName: "Organic Crop Bio-Protector & Spray", doseUnit: "L", quantity: 5, cost: 3200, purchaseDate: "2026-06-08", billDate: "2026-06-08", billNo: "VC-901", supplier: "AgriCare Supplies", ledgerId: "el-2", particularName: "Medicine Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-06-08" },
    { id: "mp-2", medicineName: "Plant Micronutrient Growth Tonic", doseUnit: "vials", quantity: 15, cost: 2750, purchaseDate: "2026-06-25", billDate: "2026-06-25", billNo: "VC-954", supplier: "AgriCare Supplies", ledgerId: "el-2", particularName: "Medicine Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-06-25" },
  ],
  vaccinePurchases: [
    { id: "vp-1", vaccineName: "Rhizobium Bio-Culture Soil Inoculant", quantity: 4, cost: 2400, purchaseDate: "2026-06-12", billDate: "2026-06-12", billNo: "VA-112", supplier: "Biological Agro Labs", ledgerId: "el-3", particularName: "Vaccine & Bio-Inoculant Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-06-12" },
    { id: "vp-2", vaccineName: "Trichoderma Viride Bio-Fungicide", quantity: 3, cost: 1800, purchaseDate: "2026-07-02", billDate: "2026-07-02", billNo: "VA-189", supplier: "Biological Agro Labs", ledgerId: "el-3", particularName: "Vaccine & Bio-Inoculant Expenses", pnlCategory: "Purchase", notes: "", createdAt: "2026-07-02" },
  ],
  otherVouchers: [
    { id: "ov-1", voucherDate: "2026-06-05", supplierName: "Agro Equipment & Spares Co.", ledgerId: "el-10", particularName: "Equipment & Machinery", billDate: "2026-06-05", billNo: "EQ-881", quantity: 1, unitName: "nos", amount: 18500, notes: "", pnlCategory: "Purchase", createdAt: "2026-06-05" },
    { id: "ov-2", voucherDate: "2026-06-18", supplierName: "Green Harvest Seeds & Saplings", ledgerId: "el-7", particularName: "Seeds & Saplings Procurement", billDate: "2026-06-18", billNo: "SS-209", quantity: 500, unitName: "nos", amount: 7500, notes: "", pnlCategory: "Direct Expenses", createdAt: "2026-06-18" },
    { id: "ov-3", voucherDate: "2026-07-01", supplierName: "TNEB Rural Electricity Board", ledgerId: "el-11", particularName: "Administrative Expenses", billDate: "2026-07-01", billNo: "EB-0726", quantity: 1, unitName: "nos", amount: 6200, notes: "", pnlCategory: "Administrative Expenses", createdAt: "2026-07-01" },
  ],
  otherSales: [],
  feedInventory: [
    { id: "fi-1", itemType: "feed", name: "Maize Silage Dry Bales", openingStock: 20, purchasedQty: 50, usedQty: 35, wastageQty: 2, closingStock: 33, unit: "bags", costPerUnit: 450, totalCost: 14850, supplier: "Supreme Silage & Agro", alertLevel: 15, status: "ADEQUATE", lastUpdated: "2026-08-01" },
    { id: "fi-2", itemType: "feed", name: "High-Protein Crop Nutrition Mash", openingStock: 10, purchasedQty: 20, usedQty: 24, wastageQty: 1, closingStock: 5, unit: "bags", costPerUnit: 1400, totalCost: 7000, supplier: "Supreme Silage & Agro", alertLevel: 8, status: "LOW_STOCK", lastUpdated: "2026-08-01" },
    { id: "fi-3", itemType: "feed", name: "Organic Bio-Fertilizer & Soil Nutrient Mix", openingStock: 8, purchasedQty: 10, usedQty: 6, wastageQty: 0, closingStock: 12, unit: "nos", costPerUnit: 350, totalCost: 4200, supplier: "AgriCare Supplies", alertLevel: 4, status: "ADEQUATE", lastUpdated: "2026-08-01" },
    { id: "fi-4", itemType: "feed", name: "Green Lucerne / CO4 Grass Chop", openingStock: 0, purchasedQty: 100, usedQty: 100, wastageQty: 0, closingStock: 0, unit: "kg", costPerUnit: 6, totalCost: 0, supplier: "Local Farm Vendor", alertLevel: 20, status: "OUT_OF_STOCK", lastUpdated: "2026-08-01" },
  ],
  medicineInventory: [
    { id: "mi-1", itemType: "medicine", name: "Organic Crop Bio-Protector & Spray", openingStock: 2, purchasedQty: 5, usedQty: 6, wastageQty: 1, closingStock: 0, unit: "L", costPerUnit: 640, totalCost: 0, supplier: "AgriCare Supplies", alertLevel: 2, status: "OUT_OF_STOCK", lastUpdated: "2026-08-01" },
    { id: "mi-2", itemType: "medicine", name: "Plant Micronutrient Growth Tonic", openingStock: 5, purchasedQty: 15, usedQty: 12, wastageQty: 0, closingStock: 8, unit: "vials", costPerUnit: 183, totalCost: 1464, supplier: "AgriCare Supplies", alertLevel: 4, status: "ADEQUATE", lastUpdated: "2026-08-01" },
    { id: "mi-3", itemType: "medicine", name: "Oxytetracycline 20% LA Injectable", openingStock: 5, purchasedQty: 5, usedQty: 7, wastageQty: 0, closingStock: 3, unit: "vials", costPerUnit: 250, totalCost: 750, supplier: "VetCare Supplies", alertLevel: 2, status: "ADEQUATE", lastUpdated: "2026-08-01" },
  ],
  vaccineInventory: [
    { id: "vi-1", itemType: "vaccine", name: "Rhizobium Bio-Culture", openingStock: 1, purchasedQty: 4, usedQty: 3, wastageQty: 0, closingStock: 2, unit: "doses", costPerUnit: 600, totalCost: 1200, supplier: "Biological Agro Labs", alertLevel: 2, status: "LOW_STOCK", lastUpdated: "2026-08-01" },
    { id: "vi-2", itemType: "vaccine", name: "Trichoderma Viride Bio-Fungicide", openingStock: 2, purchasedQty: 3, usedQty: 2, wastageQty: 0, closingStock: 3, unit: "doses", costPerUnit: 600, totalCost: 1800, supplier: "Biological Agro Labs", alertLevel: 2, status: "ADEQUATE", lastUpdated: "2026-08-01" },
    { id: "vi-3", itemType: "vaccine", name: "Bio-Shield Plant Defense Formulation", openingStock: 2, purchasedQty: 2, usedQty: 1, wastageQty: 0, closingStock: 3, unit: "vials", costPerUnit: 750, totalCost: 2250, supplier: "Biological Agro Labs", alertLevel: 1, status: "ADEQUATE", lastUpdated: "2026-08-01" },
  ],
  stockValuations: [
    { id: "sv-1", periodName: "FY 2026-27 (Current)", fromDate: "2026-04-01", toDate: "2027-03-31", openingStock: 450000, closingStock: 680000, createdAt: "2026-04-01" },
    { id: "sv-2", periodName: "FY 2025-26 (Past Year)", fromDate: "2025-04-01", toDate: "2026-03-31", openingStock: 320000, closingStock: 450000, createdAt: "2025-04-01" },
  ],
  ledgerGroups: [
    { id: "lg-1", groupName: "Direct Expenses", description: "Direct operational costs (feed, seeds, field labor)", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Direct Expenses", createdAt: "2026-01-01" },
    { id: "lg-2", groupName: "Indirect Expenses", description: "Overheads and administrative running costs", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Indirect Expenses", createdAt: "2026-01-01" },
    { id: "lg-3", groupName: "Administrative Expenses", description: "Office, legal, utilities and estate security", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Administrative Expenses", createdAt: "2026-01-01" },
    { id: "lg-4", groupName: "Selling Expenses", description: "Transport, packaging and marketing costs", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Selling Expenses", createdAt: "2026-01-01" },
    { id: "lg-5", groupName: "Sales", description: "Revenue from livestock, crops, manure & produce", groupType: "INCOME", pnlSide: "CREDIT", linkedCategory: "Sales", createdAt: "2026-01-01" },
    { id: "lg-6", groupName: "Direct Income", description: "Direct operational PWCW revenues", groupType: "INCOME", pnlSide: "CREDIT", linkedCategory: "Direct Income", createdAt: "2026-01-01" },
    { id: "lg-7", groupName: "Indirect Income", description: "Rent, interest and miscellaneous receipts", groupType: "INCOME", pnlSide: "CREDIT", linkedCategory: "Indirect Income", createdAt: "2026-01-01" },
    { id: "lg-8", groupName: "Current Assets", description: "Cash, bank balance, inventories and receivables", groupType: "ASSET", pnlSide: "DEBIT", linkedCategory: "Current Assets", createdAt: "2026-01-01" },
    { id: "lg-9", groupName: "Fixed Assets", description: "Tractors, machinery, sheds and land improvements", groupType: "ASSET", pnlSide: "DEBIT", linkedCategory: "Fixed Assets", createdAt: "2026-01-01" },
    { id: "lg-10", groupName: "Current Liabilities", description: "Trade payables, short-term borrowings", groupType: "LIABILITY", pnlSide: "CREDIT", linkedCategory: "Current Liabilities", createdAt: "2026-01-01" },
    { id: "lg-11", groupName: "Capital Account", description: "Owner equity and partner capital investments", groupType: "LIABILITY", pnlSide: "CREDIT", linkedCategory: "Capital Account", createdAt: "2026-01-01" },
  ],
  expenseLedgers: [],
  godownItems: [],
  godownMovements: [],
};

const emptyDatabaseState: EstateDatabase = {
  plots: [],
  crops: [],
  plotCrops: [],
  fertilizerLogs: [],
  dieselLogs: [],
  machineryLogs: [],
  laborLogs: [],
  productionLogs: [],
  salesLogs: [],
  generalPurchaseLogs: [],
  employeeRoles: [],
  employees: [],
  attendance: [],
  wages: [],
  leaves: [],
  expenseUnits: [],
  feedPurchases: [],
  medicinePurchases: [],
  vaccinePurchases: [],
  otherVouchers: [],
  otherSales: [],
  feedInventory: [],
  medicineInventory: [],
  vaccineInventory: [],
  stockValuations: [],
  ledgerGroups: [],
  expenseLedgers: [],
  godownItems: [],
  godownMovements: [],
  cropCategories: [...DEFAULT_CROP_CATEGORIES],
  groupTypes: [...DEFAULT_GROUP_TYPES],
  purchaseCategories: [...DEFAULT_PURCHASE_CATEGORIES],
};

// In-memory cache
let cachedDb: EstateDatabase | null = null;

const DATA_DIR = path.join(process.cwd(), "data");
const STORAGE_FILE = path.join(DATA_DIR, "estate-storage.json");
const TMP_FILE = path.join(DATA_DIR, "estate-storage.tmp");

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.error("Error creating data directory", e);
    }
  }
}

export function getDatabase(): EstateDatabase {
  if (cachedDb) {
    return cachedDb;
  }

  ensureDataDirectory();

  if (fs.existsSync(STORAGE_FILE)) {
    try {
      const raw = fs.readFileSync(STORAGE_FILE, "utf8");
      if (raw && raw.trim().length > 0) {
        const parsed = JSON.parse(raw);
        const dbObj: EstateDatabase = { ...emptyDatabaseState, ...parsed };
        if (!dbObj.cropCategories || !Array.isArray(dbObj.cropCategories) || dbObj.cropCategories.length === 0) {
          const existingCropTypes = (dbObj.crops || []).map((c) => c.type).filter(Boolean);
          dbObj.cropCategories = Array.from(new Set([...DEFAULT_CROP_CATEGORIES, ...existingCropTypes]));
        }
        if (!dbObj.groupTypes || !Array.isArray(dbObj.groupTypes) || dbObj.groupTypes.length === 0) {
          const existingGroupTypes = (dbObj.ledgerGroups || []).map((g) => g.groupType).filter(Boolean);
          dbObj.groupTypes = Array.from(new Set([...DEFAULT_GROUP_TYPES, ...existingGroupTypes]));
        }
        if (!dbObj.purchaseCategories || !Array.isArray(dbObj.purchaseCategories) || dbObj.purchaseCategories.length === 0) {
          const existingVoucherCats = (dbObj.generalPurchaseLogs || []).map((v) => v.category).filter(Boolean);
          dbObj.purchaseCategories = Array.from(new Set([...DEFAULT_PURCHASE_CATEGORIES, ...existingVoucherCats]));
        }
        if (!dbObj.godownItems || !Array.isArray(dbObj.godownItems)) {
          dbObj.godownItems = [];
        }
        if (!dbObj.godownMovements || !Array.isArray(dbObj.godownMovements)) {
          dbObj.godownMovements = [];
        }
        if (!dbObj.expenseUnits || !Array.isArray(dbObj.expenseUnits) || dbObj.expenseUnits.length === 0) {
          dbObj.expenseUnits = JSON.parse(JSON.stringify(DEFAULT_UNITS));
        }
        if (!dbObj.salesCategories || !Array.isArray(dbObj.salesCategories) || dbObj.salesCategories.length === 0) {
          dbObj.salesCategories = [...DEFAULT_SALES_CATEGORIES];
        }
        cachedDb = dbObj;
        return cachedDb as EstateDatabase;
      }
    } catch (e) {
      console.error("Error reading storage file, initializing defaults", e);
    }
  }

  cachedDb = JSON.parse(JSON.stringify(defaultSeedData));
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(cachedDb, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing initial seed data", e);
  }
  return cachedDb as EstateDatabase;
}

let writeTimeout: NodeJS.Timeout | null = null;
let isWriting = false;
let pendingWriteData: EstateDatabase | null = null;

async function performAtomicWrite(data: EstateDatabase) {
  try {
    ensureDataDirectory();
    const serialized = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(TMP_FILE, serialized, "utf8");
    await fs.promises.rename(TMP_FILE, STORAGE_FILE);
  } catch (e) {
    console.error("Error saving database asynchronously", e);
  } finally {
    isWriting = false;
    if (pendingWriteData) {
      const nextData = pendingWriteData;
      pendingWriteData = null;
      isWriting = true;
      performAtomicWrite(nextData);
    }
  }
}

export function saveDatabase(data: EstateDatabase) {
  cachedDb = data;
  pendingWriteData = data;
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => {
    if (!isWriting && pendingWriteData) {
      const toWrite = pendingWriteData;
      pendingWriteData = null;
      isWriting = true;
      performAtomicWrite(toWrite);
    }
  }, 40);
}

export function resetAllData(): EstateDatabase {
  const freshEmpty = JSON.parse(JSON.stringify(emptyDatabaseState));
  cachedDb = freshEmpty;
  saveDatabase(freshEmpty);
  return cachedDb as EstateDatabase;
}

