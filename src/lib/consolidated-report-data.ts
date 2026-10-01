import {
  getDatabase,
  WageEntryItem,
  WorkerAttendanceItem,
} from "./db-storage";
import { getPlots } from "./master-data";
import { getCropCycles } from "./crop-cycle-data";
import { getDailyLogs } from "./daily-log-data";
import { getMachineUsageLogs } from "./machinery-data";
import { getExpenses, getPettyCashStatus } from "./expenses-data";

export interface ConsolidatedReportFilters {
  plotId?: string;
  cropCycleId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ConsolidatedReportKPIs {
  // Financial Overview
  totalIncome: number;
  totalExpenses: number;
  netProfitLoss: number;
  isProfitable: boolean;
  profitMarginPercent: number;

  // Breakdown of Expenses by Stream
  cropDirectExpenses: number;
  laborWageExpenses: number;
  machineryOperatingCost: number;
  generalOverheadExpenses: number;
  pettyCashOutflow: number;

  // Operations & Work Tracking
  totalDailyLogsCount: number;
  totalActivitiesCount: number;
  activitiesCompletedCount: number;
  activityCompletionRate: number;

  // Workforce & Labor
  totalWorkerDaysPresent: number;
  totalWagesPaid: number;
  totalWagesOwed: number;

  // Machinery
  totalMachineHoursLogged: number;
  totalMachineFuelCost: number;
  totalMachineMaintenanceCost: number;

  // Petty Cash
  currentPettyCashBalance: number;
}

export interface ConsolidatedLedgerRow {
  id: string;
  date: string;
  stream: "DAILY_WORK" | "CROP_EXPENSE" | "CROP_INCOME" | "WORKER_WAGE" | "MACHINERY" | "GENERAL_EXPENSE" | "PETTY_CASH";
  plotName: string;
  cropName: string;
  categoryOrStatus: string;
  description: string;
  debitExpense: number;
  creditIncome: number;
}

export interface ConsolidatedReportData {
  filters: ConsolidatedReportFilters;
  generatedAt: string;
  kpis: ConsolidatedReportKPIs;
  sections: {
    dailyLogs: {
      totalLogs: number;
      completedLogs: number;
      notDoneActivities: {
        date: string;
        plotName: string;
        activity: string;
        reason?: string;
      }[];
    };
    cropFinancials: {
      cyclesCount: number;
      totalIncome: number;
      totalExpenses: number;
      netProfitLoss: number;
      cyclesBreakdown: {
        cycleId: string;
        plotName: string;
        cropName: string;
        status: string;
        income: number;
        expenses: number;
        net: number;
      }[];
    };
    workforceWages: {
      totalWorkersActive: number;
      attendancePresentDays: number;
      totalWagesComputed: number;
      totalWagesPaid: number;
      unpaidWages: number;
      workerSummary: {
        workerId: string;
        workerName: string;
        daysPresent: number;
        wagesComputed: number;
        wagesPaid: number;
        status: string;
      }[];
    };
    machineryUsage: {
      totalRuns: number;
      totalHours: number;
      totalFuelCost: number;
      totalMaintenanceCost: number;
      machinesBreakdown: {
        machineName: string;
        type: string;
        hours: number;
        cost: number;
      }[];
    };
    expensesAndPettyCash: {
      generalTotal: number;
      pettyTotal: number;
      currentPettyBalance: number;
      recentDisbursements: {
        id: string;
        date: string;
        category: string;
        description: string;
        amount: number;
        paidBy?: string;
      }[];
    };
  };
  ledger: ConsolidatedLedgerRow[];
}

/**
 * Build the master consolidated report across all 4 modules:
 * 1. Daily Work Tracking (Prompt 1)
 * 2. Seed-to-Harvest Financials (Prompt 2)
 * 3. Worker Attendance & Wages (Prompt 3)
 * 4. Machinery & Petty Cash Expenses (Prompt 4)
 */
export function getConsolidatedReport(filters?: ConsolidatedReportFilters): ConsolidatedReportData {
  const db = getDatabase();
  const plots = getPlots();
  const cropCycles = getCropCycles();
  const pettyStatus = getPettyCashStatus();

  const startDate = filters?.startDate || "1970-01-01";
  const endDate = filters?.endDate || "2099-12-31";

  // Filter helper
  const inRange = (d: string) => d >= startDate && d <= endDate;

  // 1. Gather Daily Logs (Prompt 1)
  let rawLogs = getDailyLogs();
  if (filters?.plotId) rawLogs = rawLogs.filter((l) => l.plotId === filters.plotId);
  rawLogs = rawLogs.filter((l) => inRange(l.date));

  const notDoneActivities: {
    date: string;
    plotName: string;
    activity: string;
    reason?: string;
  }[] = [];

  let totalActivitiesCount = 0;
  let activitiesCompletedCount = 0;

  for (const log of rawLogs) {
    for (const act of log.activities || []) {
      totalActivitiesCount++;
      if (act.completedFlag) {
        activitiesCompletedCount++;
      } else {
        notDoneActivities.push({
          date: log.date,
          plotName: log.plotName || "Plot",
          activity: act.customActivity || act.activityType,
          reason: act.reasonIfNotDone || undefined,
        });
      }
    }
  }

  const activityCompletionRate =
    totalActivitiesCount > 0
      ? Math.round((activitiesCompletedCount / totalActivitiesCount) * 1000) / 10
      : 0;

  // 2. Gather Crop Cycles & Direct Financials (Prompt 2)
  let rawCycles = cropCycles;
  if (filters?.plotId) rawCycles = rawCycles.filter((c) => c.plotId === filters.plotId);
  if (filters?.cropCycleId) rawCycles = rawCycles.filter((c) => c.id === filters.cropCycleId);

  let rawExpenses = db.cropExpenses || [];
  let rawIncomes = db.cropIncomes || [];

  if (filters?.cropCycleId) {
    rawExpenses = rawExpenses.filter((e) => e.cropCycleId === filters.cropCycleId);
    rawIncomes = rawIncomes.filter((i) => i.cropCycleId === filters.cropCycleId);
  } else if (filters?.plotId) {
    const validCycleIds = new Set(rawCycles.map((c) => c.id));
    rawExpenses = rawExpenses.filter((e) => validCycleIds.has(e.cropCycleId));
    rawIncomes = rawIncomes.filter((i) => validCycleIds.has(i.cropCycleId));
  }
  rawExpenses = rawExpenses.filter((e) => inRange(e.date));
  rawIncomes = rawIncomes.filter((i) => inRange(i.date));

  const totalDirectCropExpenses = rawExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const totalCropIncome = rawIncomes.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  const cyclesBreakdown = rawCycles.map((c) => {
    const cExps = rawExpenses.filter((e) => e.cropCycleId === c.id);
    const cIncs = rawIncomes.filter((i) => i.cropCycleId === c.id);
    const exp = cExps.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const inc = cIncs.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    return {
      cycleId: c.id,
      plotName: c.plotName || "Plot",
      cropName: c.cropName,
      status: c.status,
      income: inc,
      expenses: exp,
      net: inc - exp,
    };
  });

  // 3. Gather Worker Attendance & Wages (Prompt 3)
  let rawWages: WageEntryItem[] = db.wageEntries || [];
  let rawAttendance: WorkerAttendanceItem[] = db.workerAttendances || [];

  if (filters?.cropCycleId) {
    rawWages = rawWages.filter((w: WageEntryItem) => w.cropCycleId === filters.cropCycleId);
  }
  rawWages = rawWages.filter((w: WageEntryItem) => inRange(w.date));
  rawAttendance = rawAttendance.filter((a: WorkerAttendanceItem) => inRange(a.date));

  const totalWagesComputed = rawWages.reduce((acc: number, w: WageEntryItem) => acc + (Number(w.computedAmount) || 0), 0);
  const totalWagesPaid = rawWages.reduce((acc: number, w: WageEntryItem) => acc + (Number(w.paidAmount) || 0), 0);
  const totalWagesOwed = Math.max(0, totalWagesComputed - totalWagesPaid);
  const totalWorkerDaysPresent = rawAttendance.filter(
    (a: WorkerAttendanceItem) => a.status === "PRESENT" || a.status === "HALF_DAY"
  ).length;

  const workers = db.workers || [];
  const workerSummary = workers.map((worker) => {
    const att = rawAttendance.filter((a: WorkerAttendanceItem) => a.workerId === worker.id && a.status === "PRESENT");
    const halfAtt = rawAttendance.filter((a: WorkerAttendanceItem) => a.workerId === worker.id && a.status === "HALF_DAY");
    const daysPresent = att.length + halfAtt.length * 0.5;

    const wEntries = rawWages.filter((w: WageEntryItem) => w.workerId === worker.id);
    const computed = wEntries.reduce((acc: number, curr: WageEntryItem) => acc + (Number(curr.computedAmount) || 0), 0);
    const paid = wEntries.reduce((acc: number, curr: WageEntryItem) => acc + (Number(curr.paidAmount) || 0), 0);

    return {
      workerId: worker.id,
      workerName: worker.name,
      daysPresent,
      wagesComputed: computed,
      wagesPaid: paid,
      status: computed === 0 ? "NO_DUES" : paid >= computed ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID",
    };
  });

  // 4. Gather Machinery Usage (Prompt 4)
  let rawMachineLogs = getMachineUsageLogs();
  if (filters?.plotId) rawMachineLogs = rawMachineLogs.filter((m) => m.plotId === filters.plotId);
  if (filters?.cropCycleId) {
    rawMachineLogs = rawMachineLogs.filter((m) => m.cropCycleId === filters.cropCycleId);
  }
  rawMachineLogs = rawMachineLogs.filter((m) => inRange(m.date));

  const totalMachineHours = rawMachineLogs.reduce((acc, m) => acc + (Number(m.hoursUsed) || 0), 0);
  const totalMachineFuelCost = rawMachineLogs.reduce((acc, m) => acc + (Number(m.fuelCost) || 0), 0);
  const totalMachineMaintenanceCost = rawMachineLogs.reduce(
    (acc, m) => acc + (Number(m.maintenanceCost) || 0),
    0
  );
  const totalMachineryOperatingCost = totalMachineFuelCost + totalMachineMaintenanceCost;

  const machineMap: Record<string, { machineName: string; type: string; hours: number; cost: number }> =
    {};
  for (const log of rawMachineLogs) {
    if (!machineMap[log.machineId]) {
      machineMap[log.machineId] = {
        machineName: log.machineName || "Machine",
        type: log.machineType || "TRACTOR",
        hours: 0,
        cost: 0,
      };
    }
    machineMap[log.machineId].hours += Number(log.hoursUsed) || 0;
    machineMap[log.machineId].cost +=
      (Number(log.fuelCost) || 0) + (Number(log.maintenanceCost) || 0);
  }

  const machinesBreakdown = Object.values(machineMap).map((item) => ({
    machineName: item.machineName,
    type: item.type,
    hours: Math.round(item.hours * 100) / 100,
    cost: Math.round(item.cost * 100) / 100,
  }));

  // 5. Gather General & Petty Cash Expenses (Prompt 4)
  let rawFarmExpenses = getExpenses();
  if (filters?.plotId) rawFarmExpenses = rawFarmExpenses.filter((e) => e.plotId === filters.plotId);
  if (filters?.cropCycleId) {
    rawFarmExpenses = rawFarmExpenses.filter((e) => e.cropCycleId === filters.cropCycleId);
  }
  rawFarmExpenses = rawFarmExpenses.filter((e) => inRange(e.date));

  const pettyExpensesList = rawFarmExpenses.filter((e) => e.category === "PETTY_CASH");
  const pettyCashExpensesTotal = pettyExpensesList.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const generalOverheadExpenses = rawFarmExpenses
    .filter((e) => e.category !== "PETTY_CASH")
    .reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // Consolidated KPIs
  // Notice: CropExpenses already has synced items for machinery and tagged expenses;
  // to avoid double-counting in master P&L if viewing unfiltered estate wide:
  // Direct Ledger Sum:
  // Expenses = (crop direct non-synced) + wages + machinery operating + general overhead
  // But simpler and universally verifiable: total expenses is sum of all debit transactions!
  const totalExpenses =
    totalDirectCropExpenses + generalOverheadExpenses + pettyCashExpensesTotal;
  const totalIncome = totalCropIncome;
  const netProfitLoss = totalIncome - totalExpenses;
  const isProfitable = netProfitLoss >= 0;
  const profitMarginPercent =
    totalIncome > 0 ? Math.round((netProfitLoss / totalIncome) * 1000) / 10 : 0;

  // Build Unified Cross-Module Ledger Rows
  const ledger: ConsolidatedLedgerRow[] = [];

  // Add Crop Expenses
  for (const exp of rawExpenses) {
    const cycle = cropCycles.find((c) => c.id === exp.cropCycleId);
    ledger.push({
      id: exp.id,
      date: exp.date,
      stream: "CROP_EXPENSE",
      plotName: cycle?.plotName || "Plot",
      cropName: cycle?.cropName || "Crop",
      categoryOrStatus: exp.category,
      description: exp.description,
      debitExpense: Number(exp.amount),
      creditIncome: 0,
    });
  }

  // Add Crop Incomes
  for (const inc of rawIncomes) {
    const cycle = cropCycles.find((c) => c.id === inc.cropCycleId);
    ledger.push({
      id: inc.id,
      date: inc.date,
      stream: "CROP_INCOME",
      plotName: cycle?.plotName || "Plot",
      cropName: cycle?.cropName || "Crop",
      categoryOrStatus: inc.source,
      description: `Sale of ${inc.quantitySold} ${inc.unit} @ ₹${inc.ratePerUnit}/${inc.unit}${inc.buyerName ? " to " + inc.buyerName : ""}`,
      debitExpense: 0,
      creditIncome: Number(inc.amount),
    });
  }

  // Add Wages
  for (const wage of rawWages) {
    const cycle = cropCycles.find((c) => c.id === wage.cropCycleId);
    ledger.push({
      id: wage.id,
      date: wage.date,
      stream: "WORKER_WAGE",
      plotName: cycle?.plotName || "Estate Wide",
      cropName: cycle?.cropName || "General Labor",
      categoryOrStatus: wage.paidStatus,
      description: `Wages for ${wage.workerName || "Worker"} (Computed: ₹${wage.computedAmount}, Paid: ₹${wage.paidAmount})`,
      debitExpense: Number(wage.computedAmount),
      creditIncome: 0,
    });
  }

  // Add Machinery Usage
  for (const mach of rawMachineLogs) {
    const cycle = cropCycles.find((c) => c.id === mach.cropCycleId);
    const opCost = (Number(mach.fuelCost) || 0) + (Number(mach.maintenanceCost) || 0);
    ledger.push({
      id: mach.id,
      date: mach.date,
      stream: "MACHINERY",
      plotName: mach.plotName || cycle?.plotName || "Fleet",
      cropName: mach.cropName || cycle?.cropName || "Field Work",
      categoryOrStatus: mach.machineType || "TRACTOR",
      description: `${mach.machineName}: ${mach.workDescription} (${mach.hoursUsed} hrs, Fuel ₹${mach.fuelCost || 0})`,
      debitExpense: opCost,
      creditIncome: 0,
    });
  }

  // Add General & Petty Expenses
  for (const farmExp of rawFarmExpenses) {
    ledger.push({
      id: farmExp.id,
      date: farmExp.date,
      stream: farmExp.category === "PETTY_CASH" ? "PETTY_CASH" : "GENERAL_EXPENSE",
      plotName: farmExp.plotName || "Overhead",
      cropName: farmExp.cropName || "General",
      categoryOrStatus: farmExp.category,
      description: `${farmExp.description}${farmExp.paidBy ? " (Paid by " + farmExp.paidBy + ")" : ""}`,
      debitExpense: Number(farmExp.amount),
      creditIncome: 0,
    });
  }

  // Sort unified ledger chronologically descending
  ledger.sort((a, b) => (b.date > a.date ? 1 : -1));

  return {
    filters: filters || {},
    generatedAt: new Date().toISOString(),
    kpis: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netProfitLoss: Math.round(netProfitLoss * 100) / 100,
      isProfitable,
      profitMarginPercent,

      cropDirectExpenses: Math.round(totalDirectCropExpenses * 100) / 100,
      laborWageExpenses: Math.round(totalWagesComputed * 100) / 100,
      machineryOperatingCost: Math.round(totalMachineryOperatingCost * 100) / 100,
      generalOverheadExpenses: Math.round(generalOverheadExpenses * 100) / 100,
      pettyCashOutflow: Math.round(pettyCashExpensesTotal * 100) / 100,

      totalDailyLogsCount: rawLogs.length,
      totalActivitiesCount,
      activitiesCompletedCount,
      activityCompletionRate,

      totalWorkerDaysPresent,
      totalWagesPaid: Math.round(totalWagesPaid * 100) / 100,
      totalWagesOwed: Math.round(totalWagesOwed * 100) / 100,

      totalMachineHoursLogged: Math.round(totalMachineHours * 100) / 100,
      totalMachineFuelCost: Math.round(totalMachineFuelCost * 100) / 100,
      totalMachineMaintenanceCost: Math.round(totalMachineMaintenanceCost * 100) / 100,

      currentPettyCashBalance: pettyStatus.currentBalance,
    },
    sections: {
      dailyLogs: {
        totalLogs: rawLogs.length,
        completedLogs: rawLogs.filter((l) => l.status === "COMPLETED").length,
        notDoneActivities,
      },
      cropFinancials: {
        cyclesCount: rawCycles.length,
        totalIncome: Math.round(totalCropIncome * 100) / 100,
        totalExpenses: Math.round(totalDirectCropExpenses * 100) / 100,
        netProfitLoss: Math.round((totalCropIncome - totalDirectCropExpenses) * 100) / 100,
        cyclesBreakdown,
      },
      workforceWages: {
        totalWorkersActive: workers.filter((w) => w.active).length,
        attendancePresentDays: totalWorkerDaysPresent,
        totalWagesComputed: Math.round(totalWagesComputed * 100) / 100,
        totalWagesPaid: Math.round(totalWagesPaid * 100) / 100,
        unpaidWages: Math.round(totalWagesOwed * 100) / 100,
        workerSummary,
      },
      machineryUsage: {
        totalRuns: rawMachineLogs.length,
        totalHours: Math.round(totalMachineHours * 100) / 100,
        totalFuelCost: Math.round(totalMachineFuelCost * 100) / 100,
        totalMaintenanceCost: Math.round(totalMachineMaintenanceCost * 100) / 100,
        machinesBreakdown,
      },
      expensesAndPettyCash: {
        generalTotal: Math.round(generalOverheadExpenses * 100) / 100,
        pettyTotal: Math.round(pettyCashExpensesTotal * 100) / 100,
        currentPettyBalance: pettyStatus.currentBalance,
        recentDisbursements: rawFarmExpenses.slice(0, 15).map((e) => ({
          id: e.id,
          date: e.date,
          category: e.category,
          description: e.description,
          amount: e.amount,
          paidBy: e.paidBy || undefined,
        })),
      },
    },
    ledger,
  };
}

/**
 * Generate CSV representation of the consolidated ledger.
 */
export function generateConsolidatedReportCsv(filters?: ConsolidatedReportFilters): string {
  const report = getConsolidatedReport(filters);
  const headers = [
    "Date",
    "Stream",
    "Plot",
    "Crop",
    "Category / Status",
    "Description",
    "Debit (Expense)",
    "Credit (Income)",
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = report.ledger.map((row) => [
    escapeCsv(row.date),
    escapeCsv(row.stream),
    escapeCsv(row.plotName),
    escapeCsv(row.cropName),
    escapeCsv(row.categoryOrStatus),
    escapeCsv(row.description),
    row.debitExpense > 0 ? row.debitExpense.toFixed(2) : "0.00",
    row.creditIncome > 0 ? row.creditIncome.toFixed(2) : "0.00",
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
