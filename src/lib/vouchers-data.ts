import { getExpenseLedgerById } from "./accounting-data";

export type VoucherType = "feed" | "medicine" | "vaccine" | "other";

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

// Seed units
let mockExpenseUnits: ExpenseUnit[] = [
  { id: "u1", unitName: "Kilograms", unitSymbol: "kg" },
  { id: "u2", unitName: "Bags (50kg)", unitSymbol: "bags" },
  { id: "u3", unitName: "Liters", unitSymbol: "L" },
  { id: "u4", unitName: "Bottles / Vials", unitSymbol: "vials" },
  { id: "u5", unitName: "Numbers / Units", unitSymbol: "nos" },
  { id: "u6", unitName: "Tons", unitSymbol: "tons" },
];

// Seed feed purchases
let mockFeedPurchases: FeedPurchase[] = [
  { id: "fp-1", feedName: "Maize Silage Dry Bales", quantity: 50, unit: "bags", cost: 22500, purchaseDate: "2026-06-01", billDate: "2026-06-01", billNo: "FF-440", supplier: "Supreme Silage & Agro", ledgerId: "el-1", particularName: "Feed Expenses", pnlCategory: "Purchase", notes: "Fortified with bio-culture", createdAt: "2026-06-01" },
  { id: "fp-2", feedName: "Organic High-Protein Nutrition Mash", quantity: 20, unit: "bags", cost: 28000, purchaseDate: "2026-06-20", billDate: "2026-06-20", billNo: "FF-512", supplier: "Supreme Silage & Agro", ledgerId: "el-1", particularName: "Feed Expenses", pnlCategory: "Purchase", notes: "Farm ration mix", createdAt: "2026-06-20" },
  { id: "fp-3", feedName: "Bio-Fertilizer & Soil Nutrient Mix", quantity: 10, unit: "nos", cost: 3500, purchaseDate: "2026-07-05", billDate: "2026-07-05", billNo: "MM-102", supplier: "AgriCare Supplies", ledgerId: "el-1", particularName: "Feed Expenses", pnlCategory: "Purchase", notes: "Nutrient mixture for field plots", createdAt: "2026-07-05" },
];

// Seed medicine purchases
let mockMedicinePurchases: MedicinePurchase[] = [
  { id: "mp-1", medicineName: "Organic Crop Bio-Protector & Spray", doseUnit: "L", quantity: 5, cost: 3200, purchaseDate: "2026-06-08", billDate: "2026-06-08", billNo: "VC-901", supplier: "AgriCare Supplies", ledgerId: "el-2", particularName: "Medicine Expenses", pnlCategory: "Purchase", notes: "Pest & fungal preventive spray", createdAt: "2026-06-08" },
  { id: "mp-2", medicineName: "Plant Micronutrient Growth Tonic", doseUnit: "vials", quantity: 15, cost: 2750, purchaseDate: "2026-06-25", billDate: "2026-06-25", billNo: "VC-954", supplier: "AgriCare Supplies", ledgerId: "el-2", particularName: "Medicine Expenses", pnlCategory: "Purchase", notes: "Foliar spray boost", createdAt: "2026-06-25" },
];

// Seed vaccine / biologics purchases
let mockVaccinePurchases: VaccinePurchase[] = [
  { id: "vp-1", vaccineName: "Rhizobium Bio-Culture (50 Doses)", quantity: 4, cost: 2400, purchaseDate: "2026-06-10", billDate: "2026-06-10", billNo: "VAC-101", supplier: "Biological Agro Labs", ledgerId: "el-3", particularName: "Vaccine Expenses", pnlCategory: "Purchase", notes: "Stored in cool environment", createdAt: "2026-06-10" },
  { id: "vp-2", vaccineName: "Trichoderma Viride Bio-Fungicide", quantity: 3, cost: 1800, purchaseDate: "2026-07-10", billDate: "2026-07-10", billNo: "VAC-132", supplier: "Biological Agro Labs", ledgerId: "el-3", particularName: "Vaccine Expenses", pnlCategory: "Purchase", notes: "Soil health inoculant", createdAt: "2026-07-10" },
];

// Seed other vouchers
let mockOtherVouchers: OtherVoucher[] = [
  { id: "ov-1", voucherDate: "2026-06-02", supplierName: "TNEB Rural Electricity Board", ledgerId: "el-6", particularName: "Electricity & Borewell", billDate: "2026-06-02", billNo: "EB-2026-06", quantity: 1, unitName: "nos", amount: 6400, notes: "Estate and pump house commercial power", pnlCategory: "Administrative Expenses", createdAt: "2026-06-02" },
  { id: "ov-2", voucherDate: "2026-06-15", supplierName: "Dr. K. Raghu Agri Agronomist", ledgerId: "el-5", particularName: "Agronomy Consultation Fees", billDate: "2026-06-15", billNo: "VET-603", quantity: 1, unitName: "nos", amount: 4500, notes: "Soil test inspection and crop advisory", pnlCategory: "Direct Expenses", createdAt: "2026-06-15" },
  { id: "ov-3", voucherDate: "2026-07-04", supplierName: "Sri Murugan Farm Spares", ledgerId: "el-10", particularName: "Equipment & Machinery", billDate: "2026-07-04", billNo: "SMS-119", quantity: 1, unitName: "nos", amount: 18500, notes: "Heavy duty rotavator blade set", pnlCategory: "Purchase", createdAt: "2026-07-04" },
];

export function getExpenseUnits(): ExpenseUnit[] {
  return mockExpenseUnits;
}

export function getVouchersSummary() {
  return {
    feedCount: mockFeedPurchases.length,
    feedTotal: mockFeedPurchases.reduce((acc, p) => acc + p.cost, 0),
    medicineCount: mockMedicinePurchases.length,
    medicineTotal: mockMedicinePurchases.reduce((acc, p) => acc + p.cost, 0),
    vaccineCount: mockVaccinePurchases.length,
    vaccineTotal: mockVaccinePurchases.reduce((acc, p) => acc + p.cost, 0),
    otherCount: mockOtherVouchers.length,
    otherTotal: mockOtherVouchers.reduce((acc, p) => acc + p.amount, 0),
  };
}

export function getVouchers(type: VoucherType | string) {
  switch (type) {
    case "feed":
      return mockFeedPurchases;
    case "medicine":
      return mockMedicinePurchases;
    case "vaccine":
      return mockVaccinePurchases;
    case "other":
      return mockOtherVouchers;
    default:
      return [];
  }
}

export function getVoucherById(type: VoucherType | string, id: string) {
  const list = getVouchers(type);
  return (list as any[]).find((item) => item.id === id);
}

export function createVoucher(type: VoucherType | string, payload: any) {
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
      mockFeedPurchases.unshift(record);
      break;
    case "medicine":
      mockMedicinePurchases.unshift(record);
      break;
    case "vaccine":
      mockVaccinePurchases.unshift(record);
      break;
    case "other":
      mockOtherVouchers.unshift(record);
      break;
    default:
      break;
  }
  return record;
}

export function updateVoucher(type: VoucherType | string, id: string, payload: any) {
  const ledger = payload.ledgerId ? getExpenseLedgerById(payload.ledgerId) : undefined;
  const particularName = ledger ? ledger.ledgerName : payload.particularName;

  const updateHelper = (list: any[]) =>
    list.map((item) => (item.id === id ? { ...item, ...payload, particularName: particularName || item.particularName } : item));

  switch (type) {
    case "feed":
      mockFeedPurchases = updateHelper(mockFeedPurchases);
      return mockFeedPurchases.find((i) => i.id === id);
    case "medicine":
      mockMedicinePurchases = updateHelper(mockMedicinePurchases);
      return mockMedicinePurchases.find((i) => i.id === id);
    case "vaccine":
      mockVaccinePurchases = updateHelper(mockVaccinePurchases);
      return mockVaccinePurchases.find((i) => i.id === id);
    case "other":
      mockOtherVouchers = updateHelper(mockOtherVouchers);
      return mockOtherVouchers.find((i) => i.id === id);
    default:
      return null;
  }
}

export function deleteVoucher(type: VoucherType | string, id: string): boolean {
  switch (type) {
    case "feed":
      mockFeedPurchases = mockFeedPurchases.filter((i) => i.id !== id);
      return true;
    case "medicine":
      mockMedicinePurchases = mockMedicinePurchases.filter((i) => i.id !== id);
      return true;
    case "vaccine":
      mockVaccinePurchases = mockVaccinePurchases.filter((i) => i.id !== id);
      return true;
    case "other":
      mockOtherVouchers = mockOtherVouchers.filter((i) => i.id !== id);
      return true;
    default:
      return false;
  }
}
