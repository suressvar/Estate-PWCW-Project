import { assertRecordId } from "./validation";
import { randomUUID } from "node:crypto";
import { withTransaction } from "./db-storage";
import { getCropCycles } from "./crop-cycle-data";
import {
ExpenseCategory,
GeneralExpenseItem,
getDatabase,
PettyCashLedgerItem,
saveDatabase,
} from "./db-storage";
import { getPlots } from "./master-data";
import { dateKey,oneOf,positiveNumber,requiredText,validateAllocation } from "./validation";

export type { ExpenseCategory,GeneralExpenseItem,PettyCashLedgerItem };

export interface PettyCashStatus {
  currentBalance: number;
  totalInflow: number;
  totalOutflow: number;
  lastTopUpDate?: string;
  lastExpenseDate?: string;
  ledgerCount: number;
}

export interface ExpenseReportSummary {
  totalExpenses: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    amount: number;
    count: number;
    percentage: number;
  }[];
  pettyCashExpensesTotal: number;
  generalExpensesTotal: number;
  taggedToPlotsTotal: number;
  taggedToCropCyclesTotal: number;
  cropAllocationBreakdown?: {
    cropName: string;
    plotName: string;
    totalAmount: number;
  }[];
}

/**
 * Get general/petty cash expenses with optional filters.
 */
export function getExpenses(filter?: {
  category?: ExpenseCategory;
  plotId?: string;
  cropCycleId?: string;
  startDate?: string;
  endDate?: string;
}): GeneralExpenseItem[] {
  const db = getDatabase();
  let expenses = db.generalExpenses || [];

  if (filter?.category) {
    expenses = expenses.filter((e) => e.category === filter.category);
  }
  if (filter?.plotId) {
    expenses = expenses.filter((e) => e.plotId === filter.plotId);
  }
  if (filter?.cropCycleId) {
    expenses = expenses.filter((e) => e.cropCycleId === filter.cropCycleId);
  }
  if (filter?.startDate) {
    expenses = expenses.filter((e) => e.date >= filter.startDate!);
  }
  if (filter?.endDate) {
    expenses = expenses.filter((e) => e.date <= filter.endDate!);
  }

  return expenses.sort((a, b) => (b.date > a.date ? 1 : -1));
}

/**
 * Get expense by ID.
 */
export function getExpenseById(id: string): GeneralExpenseItem | undefined {
  const db = getDatabase();
  return (db.generalExpenses || []).find((e) => e.id === id);
}

/**
 * Log a new general or petty cash expense.
 * Automatically updates petty cash running ledger if category is PETTY_CASH.
 * Automatically/idempotently syncs to CropExpense under MISC if tagged to a CropCycle.
 */
function addExpenseImpl(data: {
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  plotId?: string | null;
  cropCycleId?: string | null;
  paidBy?: string | null;
  receiptRef?: string | null;
}): GeneralExpenseItem {
  data.amount = positiveNumber(data.amount, "Expense amount");
  dateKey(data.date);
  data.category = oneOf(data.category, ["GENERAL", "PETTY_CASH", "MAINTENANCE", "ADMIN", "OTHER"], "Expense category", "GENERAL");
  if (!data.amount || data.amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }
  if (!data.date) {
    throw new Error("Expense date is required.");
  }
  if (!data.description || !data.description.trim()) {
    throw new Error("Expense description is required.");
  }

  const plots = getPlots();
  validateAllocation(getDatabase(), data.plotId, data.cropCycleId);
  const plot = data.plotId ? plots.find((p) => p.id === data.plotId) : undefined;

  const cycles = getCropCycles();
  const cycle = data.cropCycleId ? cycles.find((c) => c.id === data.cropCycleId) : undefined;

  const db = getDatabase();
  if (!db.generalExpenses) db.generalExpenses = [];

  const now = new Date().toISOString();
  const newExpense: GeneralExpenseItem = {
    id: `exp_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
    category: data.category || "GENERAL",
    amount: Number(data.amount),
    date: data.date,
    description: data.description.trim(),
    plotId: data.plotId || (cycle ? cycle.plotId : null),
    plotName: plot ? plot.name : cycle ? cycle.plotName : null,
    cropCycleId: data.cropCycleId || null,
    cropName: cycle ? cycle.cropName : undefined,
    paidBy: data.paidBy?.trim() || undefined,
    receiptRef: data.receiptRef?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.generalExpenses.unshift(newExpense);
  saveDatabase(db);

  // If PETTY_CASH, record disbursement in daily ledger
  if (newExpense.category === "PETTY_CASH") {
    recalculatePettyCashLedger();
  }

  // If tagged to cropCycle, sync into CropExpense under MISC
  syncExpenseToCropExpense(newExpense);

  return newExpense;
}

/**
 * Update an existing expense.
 */
function updateExpenseImpl(
  id: string,
  data: Partial<GeneralExpenseItem>
): GeneralExpenseItem | undefined {
  assertRecordId(id, data);
  if (data.amount !== undefined) data.amount = positiveNumber(data.amount, "Expense amount");
  if (data.date !== undefined) dateKey(data.date);
  if (data.description !== undefined) data.description = requiredText(data.description, "Description");
  if (data.category !== undefined) oneOf(data.category, ["GENERAL", "PETTY_CASH", "MAINTENANCE", "ADMIN", "OTHER"], "Expense category");
  const db = getDatabase();
  if (!db.generalExpenses) return undefined;

  const idx = db.generalExpenses.findIndex((e) => e.id === id);
  if (idx < 0) return undefined;

  const current = db.generalExpenses[idx];
  validateAllocation(db, data.plotId === undefined ? current.plotId : data.plotId, data.cropCycleId === undefined ? current.cropCycleId : data.cropCycleId);
  const updated: GeneralExpenseItem = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.generalExpenses[idx] = updated;
  saveDatabase(db);

  if (current.category === "PETTY_CASH" || updated.category === "PETTY_CASH") {
    recalculatePettyCashLedger();
  }

  syncExpenseToCropExpense(updated);
  return updated;
}

/**
 * Delete an expense and remove sync.
 */
function deleteExpenseImpl(id: string): boolean {
  const db = getDatabase();
  if (!db.generalExpenses) return false;

  const target = db.generalExpenses.find((e) => e.id === id);
  if (!target) return false;

  db.generalExpenses = db.generalExpenses.filter((e) => e.id !== id);

  // Remove synced crop expense if any
  if (db.cropExpenses) {
    const sourceRefId = `expense_${id}`;
    db.cropExpenses = db.cropExpenses.filter((ce) => ce.sourceRefId !== sourceRefId);
  }

  saveDatabase(db);

  if (target.category === "PETTY_CASH") {
    recalculatePettyCashLedger();
  }

  return true;
}

/**
 * Idempotent sync of general or petty expense into CropExpense under MISC.
 */
export function syncExpenseToCropExpense(expense: GeneralExpenseItem): void {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.cropExpenses) db.cropExpenses = [];

  const sourceRefId = `expense_${expense.id}`;
  const existingIdx = db.cropExpenses.findIndex((e) => e.sourceRefId === sourceRefId);

  // If unlinked from cropCycle, remove if exists
  if (!expense.cropCycleId) {
    if (existingIdx >= 0) {
      db.cropExpenses.splice(existingIdx, 1);
      saveDatabase(db);
    }
    return;
  }

  const desc = `[${expense.category}] ${expense.description} (Paid by: ${expense.paidBy || "Estate"})`;

  if (existingIdx >= 0) {
    db.cropExpenses[existingIdx].cropCycleId = expense.cropCycleId;
    db.cropExpenses[existingIdx].amount = Number(expense.amount);
    db.cropExpenses[existingIdx].date = expense.date;
    db.cropExpenses[existingIdx].description = desc;
    db.cropExpenses[existingIdx].updatedAt = new Date().toISOString();
  } else {
    db.cropExpenses.push({
      id: `ce_exp_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      cropCycleId: expense.cropCycleId,
      category: "MISC",
      amount: Number(expense.amount),
      date: expense.date,
      description: desc,
      linkedDailyLogId: null,
      sourceRefId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  saveDatabase(db);

  });
}

/**
 * Record a petty cash top-up (cash added to the register).
 */
function topUpPettyCashImpl(data: {
  amount: number;
  date: string;
  notes?: string;
}): PettyCashLedgerItem {
  data.amount = positiveNumber(data.amount, "Top-up amount");
  dateKey(data.date);
  if (!data.amount || data.amount <= 0) {
    throw new Error("Top up amount must be greater than zero.");
  }
  if (!data.date) {
    throw new Error("Date is required.");
  }

  const db = getDatabase();
  if (!db.pettyCashLedger) db.pettyCashLedger = [];

  // Check if a ledger row exists for this date
  let row = db.pettyCashLedger.find((r) => r.date === data.date);
  const now = new Date().toISOString();

  if (row) {
    row.amountIn += Number(data.amount);
    row.notes = row.notes
      ? `${row.notes}; Top-up: ₹${data.amount} (${data.notes || "Added"})`
      : `Top-up: ₹${data.amount} (${data.notes || "Added"})`;
    row.updatedAt = now;
  } else {
    row = {
      id: `pcl_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      date: data.date,
      openingBalance: 0,
      amountIn: Number(data.amount),
      amountOut: 0,
      closingBalance: 0,
      notes: data.notes ? `Top-up: ₹${data.amount} (${data.notes})` : `Top-up: ₹${data.amount}`,
      createdAt: now,
      updatedAt: now,
    };
    db.pettyCashLedger.push(row);
  }

  saveDatabase(db);
  recalculatePettyCashLedger();

  // Return refreshed row
  return getPettyCashLedger().find((r) => r.date === data.date) || row;
}

/**
 * Recalculate the entire petty cash ledger chronological order:
 * openingBalance[d] = closingBalance[d-1]
 * amountOut[d] = sum of expenses on date d with category == PETTY_CASH
 * closingBalance[d] = openingBalance[d] + amountIn[d] - amountOut[d]
 */
export function recalculatePettyCashLedger(): void {
  return withTransaction(() => {
  const db = getDatabase();
  if (!db.pettyCashLedger) db.pettyCashLedger = [];
  if (!db.generalExpenses) db.generalExpenses = [];

  const pettyExpenses = db.generalExpenses.filter((e) => e.category === "PETTY_CASH");

  // Gather all unique dates from existing ledger rows and petty expenses
  const datesSet = new Set<string>();
  for (const row of db.pettyCashLedger) {
    datesSet.add(row.date);
  }
  for (const exp of pettyExpenses) {
    datesSet.add(exp.date);
  }

  const sortedDates = Array.from(datesSet).sort();

  let runningOpeningBalance = 0;
  const newLedger: PettyCashLedgerItem[] = [];

  for (const d of sortedDates) {
    const existing = db.pettyCashLedger.find((r) => r.date === d);
    const amountIn = existing ? Number(existing.amountIn) || 0 : 0;
    const notes = existing?.notes || null;

    // Outflow is the sum of petty cash expenses on this date
    const amountOut = pettyExpenses
      .filter((e) => e.date === d)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const closingBalance = runningOpeningBalance + amountIn - amountOut;

    newLedger.push({
      id: existing?.id || `pcl_${randomUUID()}_${Math.random().toString(36).substring(2, 6)}`,
      date: d,
      openingBalance: Math.round(runningOpeningBalance * 100) / 100,
      amountIn: Math.round(amountIn * 100) / 100,
      amountOut: Math.round(amountOut * 100) / 100,
      closingBalance: Math.round(closingBalance * 100) / 100,
      notes,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    runningOpeningBalance = closingBalance;
  }

  db.pettyCashLedger = newLedger;
  saveDatabase(db);

  });
}

/**
 * Get the sorted petty cash ledger.
 */
export function getPettyCashLedger(): PettyCashLedgerItem[] {
  const db = getDatabase();
  return (db.pettyCashLedger || []).sort((a, b) => (b.date > a.date ? 1 : -1));
}

/**
 * Get current live petty cash status: current balance, total in, total out.
 */
export function getPettyCashStatus(): PettyCashStatus {
  const ledger = getPettyCashLedger(); // sorted descending
  if (ledger.length === 0) {
    return {
      currentBalance: 0,
      totalInflow: 0,
      totalOutflow: 0,
      ledgerCount: 0,
    };
  }

  // The latest date is ledger[0]
  const latestRow = ledger[0];
  const totalInflow = ledger.reduce((acc, r) => acc + (Number(r.amountIn) || 0), 0);
  const totalOutflow = ledger.reduce((acc, r) => acc + (Number(r.amountOut) || 0), 0);

  const topUpRows = ledger.filter((r) => r.amountIn > 0);
  const expenseRows = ledger.filter((r) => r.amountOut > 0);

  return {
    currentBalance: latestRow.closingBalance,
    totalInflow: Math.round(totalInflow * 100) / 100,
    totalOutflow: Math.round(totalOutflow * 100) / 100,
    lastTopUpDate: topUpRows.length > 0 ? topUpRows[0].date : undefined,
    lastExpenseDate: expenseRows.length > 0 ? expenseRows[0].date : undefined,
    ledgerCount: ledger.length,
  };
}

/**
 * Get expense summary and breakdown by category.
 */
export function getExpenseSummaryReport(): ExpenseReportSummary {
  const expenses = getExpenses();
  const totalExpenses = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const categories: ExpenseCategory[] = ["GENERAL", "PETTY_CASH", "MAINTENANCE", "ADMIN", "OTHER"];
  const categoryBreakdown = categories.map((cat) => {
    const list = expenses.filter((e) => e.category === cat);
    const amount = list.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0;
    return {
      category: cat,
      amount,
      count: list.length,
      percentage,
    };
  });

  const pettyCashExpensesTotal = expenses
    .filter((e) => e.category === "PETTY_CASH")
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const generalExpensesTotal = totalExpenses - pettyCashExpensesTotal;

  const taggedToPlotsTotal = expenses
    .filter((e) => Boolean(e.plotId))
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  const taggedToCropCyclesTotal = expenses
    .filter((e) => Boolean(e.cropCycleId))
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  return {
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    categoryBreakdown,
    pettyCashExpensesTotal: Math.round(pettyCashExpensesTotal * 100) / 100,
    generalExpensesTotal: Math.round(generalExpensesTotal * 100) / 100,
    taggedToPlotsTotal: Math.round(taggedToPlotsTotal * 100) / 100,
    taggedToCropCyclesTotal: Math.round(taggedToCropCyclesTotal * 100) / 100,
  };
}

export function addExpense(...args: Parameters<typeof addExpenseImpl>) {
  return withTransaction(() => addExpenseImpl(...args));
}

export function updateExpense(...args: Parameters<typeof updateExpenseImpl>) {
  return withTransaction(() => updateExpenseImpl(...args));
}

export function deleteExpense(...args: Parameters<typeof deleteExpenseImpl>) {
  return withTransaction(() => deleteExpenseImpl(...args));
}

export function topUpPettyCash(...args: Parameters<typeof topUpPettyCashImpl>) {
  return withTransaction(() => topUpPettyCashImpl(...args));
}
