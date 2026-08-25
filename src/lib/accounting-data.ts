export type GroupType = "EXPENSE" | "INCOME" | "LIABILITY" | "ASSET";
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

// Seed Ledger Groups
let mockLedgerGroups: LedgerGroupItem[] = [
  { id: "lg-1", groupName: "Direct Expenses", description: "Direct operational costs (feed, seeds, field labor)", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Direct Expenses", createdAt: "2026-01-01" },
  { id: "lg-2", groupName: "Indirect Expenses", description: "Overheads and administrative running costs", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Indirect Expenses", createdAt: "2026-01-01" },
  { id: "lg-3", groupName: "Administrative Expenses", description: "Office, legal, utilities and estate security", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Administrative Expenses", createdAt: "2026-01-01" },
  { id: "lg-4", groupName: "Selling Expenses", description: "Transport, packaging and marketing costs", groupType: "EXPENSE", pnlSide: "DEBIT", linkedCategory: "Selling Expenses", createdAt: "2026-01-01" },
  { id: "lg-5", groupName: "Sales", description: "Revenue from livestock, crops, manure & produce", groupType: "INCOME", pnlSide: "CREDIT", linkedCategory: "Sales", createdAt: "2026-01-01" },
  { id: "lg-6", groupName: "Direct Income", description: "Direct operational farm revenues", groupType: "INCOME", pnlSide: "CREDIT", linkedCategory: "Direct Income", createdAt: "2026-01-01" },
  { id: "lg-7", groupName: "Indirect Income", description: "Rent, interest and miscellaneous receipts", groupType: "INCOME", pnlSide: "CREDIT", linkedCategory: "Indirect Income", createdAt: "2026-01-01" },
  { id: "lg-8", groupName: "Current Assets", description: "Cash, bank balance, inventories and receivables", groupType: "ASSET", pnlSide: "DEBIT", linkedCategory: "Current Assets", createdAt: "2026-01-01" },
  { id: "lg-9", groupName: "Fixed Assets", description: "Tractors, machinery, sheds and land improvements", groupType: "ASSET", pnlSide: "DEBIT", linkedCategory: "Fixed Assets", createdAt: "2026-01-01" },
  { id: "lg-10", groupName: "Current Liabilities", description: "Trade payables, short-term borrowings", groupType: "LIABILITY", pnlSide: "CREDIT", linkedCategory: "Current Liabilities", createdAt: "2026-01-01" },
  { id: "lg-11", groupName: "Capital Account", description: "Owner equity and partner capital investments", groupType: "LIABILITY", pnlSide: "CREDIT", linkedCategory: "Capital Account", createdAt: "2026-01-01" },
];

// Seed Expense / Account Ledgers
let mockExpenseLedgers: ExpenseLedgerItem[] = [
  { id: "el-1", ledgerName: "Feed Expenses", groupId: "lg-1", groupName: "Direct Expenses", groupType: "EXPENSE", description: "Concentrates, silage, dry fodder and minerals", createdAt: "2026-01-01" },
  { id: "el-2", ledgerName: "Medicine Expenses", groupId: "lg-1", groupName: "Direct Expenses", groupType: "EXPENSE", description: "Antibiotics, dewormers, vitamins and tonics", createdAt: "2026-01-01" },
  { id: "el-3", ledgerName: "Vaccine & Bio-Inoculant Expenses", groupId: "lg-1", groupName: "Direct Expenses", groupType: "EXPENSE", description: "Bio-cultures, soil inoculants & plant immunity agents", createdAt: "2026-01-01" },
  { id: "el-4", ledgerName: "Labor & Wages", groupId: "lg-1", groupName: "Direct Expenses", groupType: "EXPENSE", description: "Daily farm workers and field wages", createdAt: "2026-01-01" },
  { id: "el-5", ledgerName: "Veterinary Fees", groupId: "lg-1", groupName: "Direct Expenses", groupType: "EXPENSE", description: "Doctor visits, breeding & health certifications", createdAt: "2026-01-01" },
  { id: "el-7", ledgerName: "Seeds & Saplings Procurement", groupId: "lg-1", groupName: "Direct Expenses", groupType: "EXPENSE", description: "Hybrid seeds, nursery saplings & grafting stocks", createdAt: "2026-01-01" },
  { id: "el-8", ledgerName: "Crop & Produce Sales", groupId: "lg-5", groupName: "Sales", groupType: "INCOME", description: "Sale of farm harvest, tomato, coconut and organic produce", createdAt: "2026-01-01" },
  { id: "el-9", ledgerName: "Organic Compost & Bio-Fertilizer Sales", groupId: "lg-6", groupName: "Direct Income", groupType: "INCOME", description: "Compost, vermicompost & organic farm byproducts", createdAt: "2026-01-01" },
  { id: "el-10", ledgerName: "Equipment & Machinery", groupId: "lg-9", groupName: "Fixed Assets", groupType: "ASSET", description: "Tractors, rotavators, sprayers, weighing scales", createdAt: "2026-01-01" },
  { id: "el-11", ledgerName: "Cash Account", groupId: "lg-8", groupName: "Current Assets", groupType: "ASSET", description: "Petty cash and register cash", createdAt: "2026-01-01" },
  { id: "el-12", ledgerName: "State Bank of India (Primary)", groupId: "lg-8", groupName: "Current Assets", groupType: "ASSET", description: "Estate Operating Current Account", createdAt: "2026-01-01" },
];

export function getLedgerGroups(): LedgerGroupItem[] {
  return mockLedgerGroups;
}

export function getLedgerGroupById(id: string): LedgerGroupItem | undefined {
  return mockLedgerGroups.find((g) => g.id === id);
}

export function createLedgerGroup(data: Omit<LedgerGroupItem, "id" | "createdAt">): LedgerGroupItem {
  const newGroup: LedgerGroupItem = {
    ...data,
    id: `lg_${Date.now()}`,
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockLedgerGroups.push(newGroup);
  return newGroup;
}

export function updateLedgerGroup(id: string, data: Partial<LedgerGroupItem>): LedgerGroupItem | undefined {
  mockLedgerGroups = mockLedgerGroups.map((g) => (g.id === id ? { ...g, ...data } : g));
  return mockLedgerGroups.find((g) => g.id === id);
}

export function deleteLedgerGroup(id: string): boolean {
  // Check if any ledgers linked
  const isUsed = mockExpenseLedgers.some((l) => l.groupId === id);
  if (isUsed) return false;
  mockLedgerGroups = mockLedgerGroups.filter((g) => g.id !== id);
  return true;
}

export function getExpenseLedgers(): ExpenseLedgerItem[] {
  return mockExpenseLedgers.map((l) => {
    const group = mockLedgerGroups.find((g) => g.id === l.groupId);
    return {
      ...l,
      groupName: group?.groupName || "General",
      groupType: group?.groupType || "EXPENSE",
    };
  });
}

export function getExpenseLedgerById(id: string): ExpenseLedgerItem | undefined {
  const ledger = mockExpenseLedgers.find((l) => l.id === id);
  if (!ledger) return undefined;
  const group = mockLedgerGroups.find((g) => g.id === ledger.groupId);
  return {
    ...ledger,
    groupName: group?.groupName || "General",
    groupType: group?.groupType || "EXPENSE",
  };
}

export function createExpenseLedger(data: Omit<ExpenseLedgerItem, "id" | "createdAt">): ExpenseLedgerItem {
  const group = mockLedgerGroups.find((g) => g.id === data.groupId);
  const newLedger: ExpenseLedgerItem = {
    ...data,
    id: `el_${Date.now()}`,
    groupName: group?.groupName || "General",
    groupType: group?.groupType || "EXPENSE",
    createdAt: new Date().toISOString().split("T")[0],
  };
  mockExpenseLedgers.push(newLedger);
  return newLedger;
}

export function updateExpenseLedger(id: string, data: Partial<ExpenseLedgerItem>): ExpenseLedgerItem | undefined {
  const group = data.groupId ? mockLedgerGroups.find((g) => g.id === data.groupId) : undefined;
  mockExpenseLedgers = mockExpenseLedgers.map((l) =>
    l.id === id
      ? {
          ...l,
          ...data,
          groupName: group ? group.groupName : l.groupName,
          groupType: group ? group.groupType : l.groupType,
        }
      : l
  );
  return getExpenseLedgerById(id);
}

export function deleteExpenseLedger(id: string): boolean {
  mockExpenseLedgers = mockExpenseLedgers.filter((l) => l.id !== id);
  return true;
}
