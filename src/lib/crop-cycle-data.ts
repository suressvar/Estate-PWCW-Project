import {
  getDatabase,
  saveDatabase,
  CropCycleItem,
  CropExpenseItem,
  CropIncomeItem,
  CropCycleStatus,
  CropExpenseCategory,
  CropIncomeSource,
} from "./db-storage";
import { getPlots } from "./master-data";

export type {
  CropCycleItem,
  CropExpenseItem,
  CropIncomeItem,
  CropCycleStatus,
  CropExpenseCategory,
  CropIncomeSource,
};

export interface CropCycleFinancialSummary {
  cycleId: string;
  cropName: string;
  plotId: string;
  plotName: string;
  status: CropCycleStatus;
  sowingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string | null;
  totalExpenses: number;
  totalIncome: number;
  netProfitLoss: number;
  isProfitable: boolean;
  roiPercent: number;
  profitMarginPercent: number;
  expenseBreakdown: {
    category: CropExpenseCategory;
    amount: number;
    percentage: number;
    count: number;
  }[];
  incomeBreakdown: {
    source: CropIncomeSource;
    amount: number;
    percentage: number;
    count: number;
  }[];
  timeline: {
    id: string;
    date: string;
    type: "SOWING" | "EXPENSE" | "HARVEST" | "INCOME" | "STATUS_CHANGE";
    title: string;
    subtitle?: string;
    amount?: number;
    category?: string;
  }[];
}

export interface PlotLifetimeRollup {
  plotId: string;
  plotName: string;
  areaAcres: number;
  totalCyclesCount: number;
  activeCyclesCount: number;
  closedCyclesCount: number;
  lifetimeExpenses: number;
  lifetimeIncome: number;
  lifetimeProfitLoss: number;
  lifetimeRoiPercent: number;
  cycles: (CropCycleItem & {
    totalExpenses: number;
    totalIncome: number;
    netProfitLoss: number;
  })[];
}

/**
 * Validates whether an entry date falls within a sane window relative to the cycle.
 * Non-blocking: returns warning message if outside window.
 */
export function validateCropCycleDateRange(
  cycle: CropCycleItem,
  entryDateStr: string
): { isWithinRange: boolean; warning?: string } {
  const [sy, sm, sd] = cycle.sowingDate.split("-").map(Number);
  const minDate = new Date(sy, sm - 1, sd);
  minDate.setDate(minDate.getDate() - 15); // 15 days grace period before sowing

  const harvestRef = cycle.actualHarvestDate || cycle.expectedHarvestDate;
  const [hy, hm, hd] = harvestRef.split("-").map(Number);
  const maxDate = new Date(hy, hm - 1, hd);
  maxDate.setDate(maxDate.getDate() + 60); // 60 days grace period after harvest for post-harvest sales/packing

  const [ey, em, ed] = entryDateStr.split("-").map(Number);
  const entryDate = new Date(ey, em - 1, ed);

  const minStr = minDate.toISOString().split("T")[0];
  const maxStr = maxDate.toISOString().split("T")[0];

  if (entryDate < minDate || entryDate > maxDate) {
    return {
      isWithinRange: false,
      warning: `Date (${entryDateStr}) falls outside the standard cycle window (${cycle.sowingDate} to ${harvestRef}). Entry recorded, but please confirm the date.`,
    };
  }

  return { isWithinRange: true };
}

/**
 * Fetch all crop cycles with optional plot & status filtering, enriched with financials.
 */
export function getCropCycles(filters?: {
  plotId?: string;
  status?: CropCycleStatus;
}): (CropCycleItem & { totalExpenses: number; totalIncome: number; netProfitLoss: number })[] {
  const db = getDatabase();
  const plots = getPlots();
  let cycles = (db.cropCycles || []).map((c) => {
    const plot = plots.find((p) => p.id === c.plotId);
    return {
      ...c,
      plotName: plot ? plot.name : c.plotName || "Unknown Plot",
    };
  });

  if (filters?.plotId) {
    cycles = cycles.filter((c) => c.plotId === filters.plotId);
  }

  if (filters?.status) {
    cycles = cycles.filter((c) => c.status === filters.status);
  }

  const allExpenses = db.cropExpenses || [];
  const allIncomes = db.cropIncomes || [];

  return cycles.map((c) => {
    const cycleExpenses = allExpenses.filter((e) => e.cropCycleId === c.id);
    const cycleIncomes = allIncomes.filter((i) => i.cropCycleId === c.id);

    const totalExpenses = cycleExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalIncome = cycleIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const netProfitLoss = totalIncome - totalExpenses;

    return {
      ...c,
      totalExpenses,
      totalIncome,
      netProfitLoss,
    };
  }).sort((a, b) => b.sowingDate.localeCompare(a.sowingDate));
}

/**
 * Get crop cycle by ID.
 */
export function getCropCycleById(id: string): CropCycleItem | undefined {
  const db = getDatabase();
  const cycle = (db.cropCycles || []).find((c) => c.id === id);
  if (!cycle) return undefined;

  const plots = getPlots();
  const plot = plots.find((p) => p.id === cycle.plotId);
  return {
    ...cycle,
    plotName: plot ? plot.name : cycle.plotName || "Unknown Plot",
  };
}

/**
 * Create a new CropCycle.
 */
export function createCropCycle(data: {
  plotId: string;
  cropName: string;
  cropType?: string;
  sowingDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string | null;
  status?: CropCycleStatus;
  notes?: string;
}): CropCycleItem {
  const db = getDatabase();
  if (!db.cropCycles) db.cropCycles = [];

  const plots = getPlots();
  const plot = plots.find((p) => p.id === data.plotId);
  const now = new Date().toISOString();

  const newCycle: CropCycleItem = {
    id: `cc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    plotId: data.plotId,
    plotName: plot ? plot.name : "Unknown Plot",
    cropName: data.cropName.trim(),
    cropType: data.cropType?.trim() || undefined,
    sowingDate: data.sowingDate,
    expectedHarvestDate: data.expectedHarvestDate,
    actualHarvestDate: data.actualHarvestDate || null,
    status: data.status || "SOWN",
    notes: data.notes?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };

  db.cropCycles.unshift(newCycle);
  saveDatabase(db);
  return newCycle;
}

/**
 * Update an existing CropCycle.
 */
export function updateCropCycle(
  id: string,
  data: Partial<CropCycleItem>
): CropCycleItem | undefined {
  const db = getDatabase();
  if (!db.cropCycles) return undefined;

  const idx = db.cropCycles.findIndex((c) => c.id === id);
  if (idx < 0) return undefined;

  const updated: CropCycleItem = {
    ...db.cropCycles[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  db.cropCycles[idx] = updated;
  saveDatabase(db);
  return updated;
}

/**
 * Delete a CropCycle and all its associated expenses and incomes.
 */
export function deleteCropCycle(id: string): boolean {
  const db = getDatabase();
  if (!db.cropCycles) return false;

  const initialCount = db.cropCycles.length;
  db.cropCycles = db.cropCycles.filter((c) => c.id !== id);

  if (db.cropExpenses) {
    db.cropExpenses = db.cropExpenses.filter((e) => e.cropCycleId !== id);
  }
  if (db.cropIncomes) {
    db.cropIncomes = db.cropIncomes.filter((i) => i.cropCycleId !== id);
  }

  saveDatabase(db);
  return db.cropCycles.length < initialCount;
}

/**
 * Add a financial expense entry to a CropCycle.
 */
export function addCropExpense(data: {
  cropCycleId: string;
  category: CropExpenseCategory;
  amount: number;
  date: string;
  description: string;
  linkedDailyLogId?: string | null;
  sourceRefId?: string | null;
}): { expense: CropExpenseItem; warning?: string } {
  const cycle = getCropCycleById(data.cropCycleId);
  if (!cycle) {
    throw new Error(`Crop cycle with id ${data.cropCycleId} not found.`);
  }

  if (!data.amount || data.amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }
  if (!data.description || !data.description.trim()) {
    throw new Error("Expense description is required.");
  }
  if (!data.date) {
    throw new Error("Expense date is required.");
  }

  const { warning } = validateCropCycleDateRange(cycle, data.date);

  const db = getDatabase();
  if (!db.cropExpenses) db.cropExpenses = [];

  const now = new Date().toISOString();
  const newExpense: CropExpenseItem = {
    id: `ce_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    cropCycleId: data.cropCycleId,
    category: data.category,
    amount: Number(data.amount),
    date: data.date,
    description: data.description.trim(),
    linkedDailyLogId: data.linkedDailyLogId || null,
    sourceRefId: data.sourceRefId || null,
    createdAt: now,
    updatedAt: now,
  };

  db.cropExpenses.unshift(newExpense);
  saveDatabase(db);

  return { expense: newExpense, warning };
}

/**
 * Delete a crop expense entry.
 */
export function deleteCropExpense(expenseId: string): boolean {
  const db = getDatabase();
  if (!db.cropExpenses) return false;

  const initial = db.cropExpenses.length;
  db.cropExpenses = db.cropExpenses.filter((e) => e.id !== expenseId);
  saveDatabase(db);
  return db.cropExpenses.length < initial;
}

/**
 * Add a financial income entry to a CropCycle.
 */
export function addCropIncome(data: {
  cropCycleId: string;
  source: CropIncomeSource;
  quantitySold: number;
  unit: string;
  ratePerUnit: number;
  amount?: number;
  date: string;
  buyerName?: string;
  invoiceNo?: string;
}): { income: CropIncomeItem; warning?: string } {
  const cycle = getCropCycleById(data.cropCycleId);
  if (!cycle) {
    throw new Error(`Crop cycle with id ${data.cropCycleId} not found.`);
  }

  const qty = Number(data.quantitySold);
  const rate = Number(data.ratePerUnit);
  if (qty <= 0) {
    throw new Error("Quantity sold must be greater than zero.");
  }
  if (rate <= 0) {
    throw new Error("Rate per unit must be greater than zero.");
  }

  const finalAmount = data.amount !== undefined ? Number(data.amount) : Math.round(qty * rate * 100) / 100;
  const { warning } = validateCropCycleDateRange(cycle, data.date);

  const db = getDatabase();
  if (!db.cropIncomes) db.cropIncomes = [];

  const now = new Date().toISOString();
  const newIncome: CropIncomeItem = {
    id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    cropCycleId: data.cropCycleId,
    source: data.source,
    quantitySold: qty,
    unit: data.unit.trim(),
    ratePerUnit: rate,
    amount: finalAmount,
    date: data.date,
    buyerName: data.buyerName?.trim() || undefined,
    invoiceNo: data.invoiceNo?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.cropIncomes.unshift(newIncome);
  saveDatabase(db);

  return { income: newIncome, warning };
}

/**
 * Delete a crop income entry.
 */
export function deleteCropIncome(incomeId: string): boolean {
  const db = getDatabase();
  if (!db.cropIncomes) return false;

  const initial = db.cropIncomes.length;
  db.cropIncomes = db.cropIncomes.filter((i) => i.id !== incomeId);
  saveDatabase(db);
  return db.cropIncomes.length < initial;
}

/**
 * Get comprehensive financial rollup for a CropCycle.
 */
export function getCropCycleFinancials(cropCycleId: string): CropCycleFinancialSummary | null {
  const cycle = getCropCycleById(cropCycleId);
  if (!cycle) return null;

  const db = getDatabase();
  const expenses = (db.cropExpenses || []).filter((e) => e.cropCycleId === cropCycleId);
  const incomes = (db.cropIncomes || []).filter((i) => i.cropCycleId === cropCycleId);

  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const netProfitLoss = totalIncome - totalExpenses;
  const isProfitable = netProfitLoss >= 0;

  const roiPercent =
    totalExpenses > 0 ? Math.round((netProfitLoss / totalExpenses) * 1000) / 10 : 0;
  const profitMarginPercent =
    totalIncome > 0 ? Math.round((netProfitLoss / totalIncome) * 1000) / 10 : 0;

  // Expense Category Breakdown
  const expenseCatMap: Record<string, { amount: number; count: number }> = {};
  for (const exp of expenses) {
    const cat = exp.category;
    if (!expenseCatMap[cat]) {
      expenseCatMap[cat] = { amount: 0, count: 0 };
    }
    expenseCatMap[cat].amount += Number(exp.amount) || 0;
    expenseCatMap[cat].count += 1;
  }

  const expenseBreakdown = Object.entries(expenseCatMap)
    .map(([category, info]) => ({
      category: category as CropExpenseCategory,
      amount: info.amount,
      count: info.count,
      percentage: totalExpenses > 0 ? Math.round((info.amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Income Source Breakdown
  const incomeSourceMap: Record<string, { amount: number; count: number }> = {};
  for (const inc of incomes) {
    const src = inc.source;
    if (!incomeSourceMap[src]) {
      incomeSourceMap[src] = { amount: 0, count: 0 };
    }
    incomeSourceMap[src].amount += Number(inc.amount) || 0;
    incomeSourceMap[src].count += 1;
  }

  const incomeBreakdown = Object.entries(incomeSourceMap)
    .map(([source, info]) => ({
      source: source as CropIncomeSource,
      amount: info.amount,
      count: info.count,
      percentage: totalIncome > 0 ? Math.round((info.amount / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Timeline generation
  const timeline: CropCycleFinancialSummary["timeline"] = [];

  // Milestone: Sowing
  timeline.push({
    id: `sowing-${cycle.id}`,
    date: cycle.sowingDate,
    type: "SOWING",
    title: `Sowing: ${cycle.cropName}`,
    subtitle: `Planted in ${cycle.plotName}`,
  });

  // Milestone: Actual or Expected Harvest
  if (cycle.actualHarvestDate) {
    timeline.push({
      id: `harvest-${cycle.id}`,
      date: cycle.actualHarvestDate,
      type: "HARVEST",
      title: "Actual Crop Harvest Completed",
      subtitle: `Harvest recorded on ${cycle.actualHarvestDate}`,
    });
  } else {
    timeline.push({
      id: `exp-harvest-${cycle.id}`,
      date: cycle.expectedHarvestDate,
      type: "HARVEST",
      title: "Estimated Target Harvest",
      subtitle: `Projected harvest window`,
    });
  }

  // Add expenses
  for (const exp of expenses) {
    timeline.push({
      id: exp.id,
      date: exp.date,
      type: "EXPENSE",
      title: `${exp.category}: ${exp.description}`,
      amount: exp.amount,
      category: exp.category,
    });
  }

  // Add incomes
  for (const inc of incomes) {
    timeline.push({
      id: inc.id,
      date: inc.date,
      type: "INCOME",
      title: `Sale: ${inc.quantitySold} ${inc.unit} @ ₹${inc.ratePerUnit}`,
      subtitle: inc.buyerName ? `Buyer: ${inc.buyerName}` : undefined,
      amount: inc.amount,
      category: inc.source,
    });
  }

  timeline.sort((a, b) => a.date.localeCompare(b.date));

  return {
    cycleId: cycle.id,
    cropName: cycle.cropName,
    plotId: cycle.plotId,
    plotName: cycle.plotName || "Plot",
    status: cycle.status,
    sowingDate: cycle.sowingDate,
    expectedHarvestDate: cycle.expectedHarvestDate,
    actualHarvestDate: cycle.actualHarvestDate,
    totalExpenses,
    totalIncome,
    netProfitLoss,
    isProfitable,
    roiPercent,
    profitMarginPercent,
    expenseBreakdown,
    incomeBreakdown,
    timeline,
  };
}

/**
 * Plot-Level Rollup: aggregates lifetime financial performance of all crop cycles ever run on that plot.
 */
export function getPlotFinancialRollup(plotId: string): PlotLifetimeRollup | null {
  const plots = getPlots();
  const plot = plots.find((p) => p.id === plotId);
  const cycles = getCropCycles({ plotId });

  if (!plot && cycles.length === 0) return null;

  const plotName = plot ? plot.name : cycles[0]?.plotName || "Plot";
  const areaAcres = plot ? Number(plot.areaAcres) || 0 : 10;

  const lifetimeExpenses = cycles.reduce((sum, c) => sum + c.totalExpenses, 0);
  const lifetimeIncome = cycles.reduce((sum, c) => sum + c.totalIncome, 0);
  const lifetimeProfitLoss = lifetimeIncome - lifetimeExpenses;

  const lifetimeRoiPercent =
    lifetimeExpenses > 0
      ? Math.round((lifetimeProfitLoss / lifetimeExpenses) * 1000) / 10
      : 0;

  const activeCyclesCount = cycles.filter(
    (c) => c.status === "SOWN" || c.status === "GROWING" || c.status === "HARVESTED"
  ).length;

  const closedCyclesCount = cycles.filter(
    (c) => c.status === "CLOSED" || c.status === "SOLD"
  ).length;

  return {
    plotId: plot ? plot.id : plotId,
    plotName,
    areaAcres,
    totalCyclesCount: cycles.length,
    activeCyclesCount,
    closedCyclesCount,
    lifetimeExpenses,
    lifetimeIncome,
    lifetimeProfitLoss,
    lifetimeRoiPercent,
    cycles,
  };
}

/**
 * Aggregate financial rollup across all plots in the estate.
 */
export function getAllPlotsFinancialRollup(): {
  estateTotalExpenses: number;
  estateTotalIncome: number;
  estateNetProfitLoss: number;
  estateTotalCycles: number;
  plotRollups: PlotLifetimeRollup[];
} {
  const plots = getPlots();
  const plotRollups: PlotLifetimeRollup[] = [];

  let estateTotalExpenses = 0;
  let estateTotalIncome = 0;
  let estateTotalCycles = 0;

  for (const p of plots) {
    const rollup = getPlotFinancialRollup(p.id);
    if (rollup) {
      plotRollups.push(rollup);
      estateTotalExpenses += rollup.lifetimeExpenses;
      estateTotalIncome += rollup.lifetimeIncome;
      estateTotalCycles += rollup.totalCyclesCount;
    }
  }

  const estateNetProfitLoss = estateTotalIncome - estateTotalExpenses;

  return {
    estateTotalExpenses,
    estateTotalIncome,
    estateNetProfitLoss,
    estateTotalCycles,
    plotRollups,
  };
}

/**
 * Idempotent sync function to pull labor and machinery usage costs into CropExpense
 * when operational logs fall within the plot and date range of a crop cycle.
 */
export function syncOperationsToCropCycle(cropCycleId: string): {
  syncedCount: number;
  totalExpensesAdded: number;
  message: string;
} {
  const cycle = getCropCycleById(cropCycleId);
  if (!cycle) {
    throw new Error(`Crop cycle with id ${cropCycleId} not found.`);
  }

  const db = getDatabase();
  if (!db.cropExpenses) db.cropExpenses = [];

  const startDate = cycle.sowingDate;
  const endDate = cycle.actualHarvestDate || cycle.expectedHarvestDate || new Date().toISOString().split("T")[0];

  let syncedCount = 0;
  let totalExpensesAdded = 0;

  // 1. Sync Labor Logs for this plot within date range
  const laborLogs = (db.laborLogs || []).filter((l) => {
    const matchesPlot =
      l.plotName === cycle.plotName ||
      (l.plotCropId && db.plotCrops.some((pc) => pc.id === l.plotCropId && pc.plotId === cycle.plotId));
    const inRange = l.date >= startDate && l.date <= endDate;
    return matchesPlot && inRange;
  });

  for (const labor of laborLogs) {
    const sourceRefId = `labor_${labor.id}`;
    const existingIndex = db.cropExpenses.findIndex(
      (e) => e.cropCycleId === cropCycleId && e.sourceRefId === sourceRefId
    );

    const amount = Number(labor.totalCost) || 0;
    if (amount <= 0) continue;

    if (existingIndex >= 0) {
      // Update existing
      db.cropExpenses[existingIndex].amount = amount;
      db.cropExpenses[existingIndex].date = labor.date;
      db.cropExpenses[existingIndex].updatedAt = new Date().toISOString();
    } else {
      // Insert new
      db.cropExpenses.push({
        id: `ce_sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cropCycleId,
        category: "LABOR",
        amount,
        date: labor.date,
        description: `Operational Labor: ${labor.menCount} Men, ${labor.womenCount} Women (${labor.cropActivityName || "Field work"})`,
        sourceRefId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      syncedCount++;
      totalExpensesAdded += amount;
    }
  }

  // 2. Sync Machinery Logs for this plot within date range
  const machineryLogs = (db.machineryLogs || []).filter((m) => {
    const matchesPlot =
      m.plotName === cycle.plotName ||
      (m.plotCropId && db.plotCrops.some((pc) => pc.id === m.plotCropId && pc.plotId === cycle.plotId));
    const inRange = m.date >= startDate && m.date <= endDate;
    return matchesPlot && inRange;
  });

  for (const machine of machineryLogs) {
    const sourceRefId = `machine_${machine.id}`;
    const existingIndex = db.cropExpenses.findIndex(
      (e) => e.cropCycleId === cropCycleId && e.sourceRefId === sourceRefId
    );

    // Calculate machinery cost (running hours * ₹500 or diesel * ₹95)
    const runningCost = (Number(machine.runningHours) || 0) * 500;
    const dieselCost = (Number(machine.dieselConsumedLiters) || 0) * 95;
    const amount = runningCost > 0 ? runningCost : dieselCost > 0 ? dieselCost : 500;

    if (existingIndex >= 0) {
      db.cropExpenses[existingIndex].amount = amount;
      db.cropExpenses[existingIndex].date = machine.date;
      db.cropExpenses[existingIndex].updatedAt = new Date().toISOString();
    } else {
      db.cropExpenses.push({
        id: `ce_sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        cropCycleId,
        category: "MACHINERY",
        amount,
        date: machine.date,
        description: `Operational Machinery: ${machine.machineName} (${machine.runningHours || 0} hrs)`,
        sourceRefId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      syncedCount++;
      totalExpensesAdded += amount;
    }
  }

  saveDatabase(db);

  return {
    syncedCount,
    totalExpensesAdded,
    message: `Synced ${syncedCount} operational entries into crop expenses.`,
  };
}
