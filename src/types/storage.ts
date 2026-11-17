// Storage contracts. Shared estate types stay in the browser-safe estate module.
import type {
  BaseLog,
  CropItem,
  DieselLogItem,
  FertilizerLogItem,
  MachineryLogItem,
  PartyItem,
  PlotCropAssociation,
  PlotItem,
  ProductionLogItem,
  VoucherLineItem
} from "./estate";

export type GeneralPurchaseLogItem = PurchaseVoucherItem;

export interface LaborLogItem extends BaseLog {
  menCount: number;
  womenCount: number;
  workingHours?: number;
  menWageRate: number;
  womenWageRate: number;
  totalCost: number;
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
  itemCode?: string;
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

export interface OperationItem {
  id: string;
  itemCode: string; // Unique SKU/Item Code (e.g. FERT-001, SEED-002, DIES-001, PEST-003, TOOL-004)
  name: string;
  category: string;
  unit: string;
  defaultRate?: number;
  hsnSacCode?: string;
  minStockAlert?: number;
  currentStock?: number;
  status: "ACTIVE" | "INACTIVE";
  description?: string;
  plotId?: string;
  plotName?: string;
  cropActivityId?: string;
  cropActivityName?: string;
  sourceGodownItemId?: string;
  createdAt: string;
  updatedAt: string;
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

// Daily Work Tracking Types
export type DailyLogStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "NOT_DONE";

export type ActivityType =
  | "SOWING"
  | "WEEDING"
  | "IRRIGATION"
  | "SPRAYING"
  | "HARVESTING"
  | "FERTILIZER_APPLICATION"
  | "LAND_PREPARATION"
  | "PRUNING"
  | "MAINTENANCE"
  | "OTHER";

export interface WorkActivityItem {
  id: string;
  dailyLogId: string;
  activityType: ActivityType;
  customActivity?: string;
  description?: string;
  plannedFlag: boolean;
  completedFlag: boolean;
  reasonIfNotDone?: string | null;
  carriedForwardFromId?: string | null;
  assignedWorkerIds?: string[];
  assignedWorkerNames?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  plotId: string;
  plotName?: string;
  status: DailyLogStatus;
  createdBy?: string;
  notes?: string;
  activities: WorkActivityItem[];
  createdAt: string;
  updatedAt: string;
}

// Crop Cycle & Financial Ledger Types
export type CropCycleStatus = "SOWN" | "GROWING" | "HARVESTED" | "SOLD" | "CLOSED";

export type CropExpenseCategory =
  | "SEEDS"
  | "FERTILIZER"
  | "PESTICIDE"
  | "LABOR"
  | "MACHINERY"
  | "IRRIGATION"
  | "TRANSPORT"
  | "MISC";

export type CropIncomeSource =
  | "MARKET_SALE"
  | "DIRECT_BUYER"
  | "GOVERNMENT_SCHEME"
  | "OTHER";

export interface CropExpenseItem {
  id: string;
  cropCycleId: string;
  category: CropExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  linkedDailyLogId?: string | null;
  sourceRefId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CropIncomeItem {
  id: string;
  cropCycleId: string;
  source: CropIncomeSource;
  quantitySold: number;
  unit: string;
  ratePerUnit: number;
  amount: number;
  date: string; // YYYY-MM-DD
  buyerName?: string;
  invoiceNo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropCycleItem {
  id: string;
  plotId: string;
  plotName?: string;
  cropName: string;
  cropType?: string;
  sowingDate: string; // YYYY-MM-DD
  expectedHarvestDate: string; // YYYY-MM-DD
  actualHarvestDate?: string | null;
  status: CropCycleStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Worker Management & Wage Ledger Types
export type WorkerAttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export type WagePaidStatus = "UNPAID" | "PAID" | "PARTIAL";

export interface WorkerItem {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  dailyWageRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerAttendanceItem {
  id: string;
  workerId: string;
  workerName?: string;
  date: string; // YYYY-MM-DD
  status: WorkerAttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerActivityLogItem {
  id: string;
  workerId: string;
  workerName?: string;
  dailyLogId: string;
  plotId: string;
  plotName?: string;
  cropCycleId?: string | null;
  cropName?: string;
  activityDescription: string;
  timeSpentHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface WageEntryItem {
  id: string;
  workerId: string;
  workerName?: string;
  date: string; // YYYY-MM-DD
  computedAmount: number;
  paidStatus: WagePaidStatus;
  paidAmount: number;
  paidDate?: string | null;
  cropCycleId?: string | null;
  paymentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Machinery & Vehicle Register Types
export type MachineType =
  | "TRACTOR"
  | "TILLER"
  | "SPRAYER"
  | "PUMP"
  | "HARVESTER"
  | "VEHICLE"
  | "DRONE"
  | "OTHER";

export interface MachineItem {
  id: string;
  name: string;
  type: MachineType;
  registrationNumber?: string;
  fuelType?: string; // Diesel, Petrol, Electric
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MachineUsageLogItem {
  id: string;
  machineId: string;
  machineName?: string;
  machineType?: MachineType;
  date: string; // YYYY-MM-DD
  plotId?: string | null;
  plotName?: string | null;
  dailyLogId?: string | null;
  workerId?: string | null;
  operatorName?: string;
  startTime?: string;
  endTime?: string;
  hoursUsed: number;
  workDescription: string;
  fuelCost?: number | null;
  maintenanceCost?: number | null;
  cropCycleId?: string | null;
  cropName?: string | null;
  createdAt: string;
  updatedAt: string;
}

// General & Petty Cash Farm Expense Types
export type ExpenseCategory =
  | "GENERAL"
  | "PETTY_CASH"
  | "MAINTENANCE"
  | "ADMIN"
  | "OTHER";

export interface GeneralExpenseItem {
  id: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  description: string;
  plotId?: string | null;
  plotName?: string | null;
  cropCycleId?: string | null;
  cropName?: string | null;
  paidBy?: string | null;
  receiptRef?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PettyCashLedgerItem {
  id: string;
  date: string; // YYYY-MM-DD
  openingBalance: number;
  amountIn: number;
  amountOut: number;
  closingBalance: number;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Complete Database Schema
export interface EstateDatabase {
  referenceCounters?: Record<string, number>;
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
  parties?: PartyItem[];
  godownItems?: GodownItem[];
  godownMovements?: GodownStockMovement[];
  dailyLogs?: DailyLogItem[];
  cropCycles?: CropCycleItem[];
  cropExpenses?: CropExpenseItem[];
  cropIncomes?: CropIncomeItem[];
  workers?: WorkerItem[];
  workerAttendances?: WorkerAttendanceItem[];
  workerActivityLogs?: WorkerActivityLogItem[];
  wageEntries?: WageEntryItem[];
  machines?: MachineItem[];
  machineUsageLogs?: MachineUsageLogItem[];
  generalExpenses?: GeneralExpenseItem[];
  pettyCashLedger?: PettyCashLedgerItem[];
  operationItems?: OperationItem[];
  cropCategories?: string[];
  groupTypes?: string[];
  purchaseCategories?: string[];
  salesCategories?: string[];
}
