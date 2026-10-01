import { test, expect } from "@playwright/test";
import {
  createMachine,
  getMachines,
  getMachineById,
  addMachineUsageLog,
  getMachineUsageLogs,
  getMachineryReport,
  getPlotMachineryConsumptionReport,
  deleteMachineUsageLog,
} from "../src/lib/machinery-data";
import {
  addExpense,
  getExpenses,
  topUpPettyCash,
  getPettyCashLedger,
  getPettyCashStatus,
  recalculatePettyCashLedger,
  getExpenseSummaryReport,
} from "../src/lib/expenses-data";
import {
  getConsolidatedReport,
  generateConsolidatedReportCsv,
} from "../src/lib/consolidated-report-data";
import { createCropCycle, getCropCycleById } from "../src/lib/crop-cycle-data";
import { getDatabase } from "../src/lib/db-storage";
import { getPlots } from "../src/lib/master-data";

test.describe("Machinery, Petty Cash & Consolidated Report Logic", () => {
  let testPlotId: string;
  let testMachineId: string;
  let testCropCycleId: string;

  test.beforeAll(() => {
    const plots = getPlots();
    testPlotId = plots[0]?.id || "plot_1";

    const machine = createMachine({
      name: "Mahindra 575 DI Test Tractor",
      type: "TRACTOR",
      registrationNumber: "TN-38-TEST-99",
      fuelType: "Diesel",
      active: true,
    });
    testMachineId = machine.id;

    const cycle = createCropCycle({
      plotId: testPlotId,
      cropName: "Test Sugarcane Consolidated Cycle",
      sowingDate: "2026-07-01",
      expectedHarvestDate: "2026-11-30",
    });
    testCropCycleId = cycle.id;
  });

  test("1. Machine creation and retrieval", () => {
    const machine = getMachineById(testMachineId);
    expect(machine).toBeDefined();
    expect(machine?.name).toBe("Mahindra 575 DI Test Tractor");
    expect(machine?.type).toBe("TRACTOR");

    const allMachines = getMachines();
    expect(allMachines.some((m) => m.id === testMachineId)).toBe(true);
  });

  test("2. Machine usage logging and idempotent CropExpense sync under MACHINERY", () => {
    const log = addMachineUsageLog({
      machineId: testMachineId,
      date: "2026-07-15",
      plotId: testPlotId,
      cropCycleId: testCropCycleId,
      workDescription: "Deep plowing and furrow making",
      hoursUsed: 5,
      fuelCost: 1500,
      maintenanceCost: 350,
    });

    expect(log.id).toBeDefined();
    expect(log.hoursUsed).toBe(5);

    // Verify CropExpense sync
    const db = getDatabase();
    const sourceRef = `machine_log_${log.id}`;
    const syncedExpense = (db.cropExpenses || []).find((e) => e.sourceRefId === sourceRef);

    expect(syncedExpense).toBeDefined();
    expect(syncedExpense?.category).toBe("MACHINERY");
    expect(syncedExpense?.amount).toBe(1850); // 1500 fuel + 350 maint
    expect(syncedExpense?.cropCycleId).toBe(testCropCycleId);
  });

  test("3. Machinery reports and plot consumption allocation", () => {
    const machReport = getMachineryReport();
    const machSummary = machReport.find((r) => r.machineId === testMachineId);
    expect(machSummary).toBeDefined();
    expect(machSummary!.totalHoursUsed).toBeGreaterThanOrEqual(5);
    expect(machSummary!.totalFuelCost).toBeGreaterThanOrEqual(1500);

    const plotReport = getPlotMachineryConsumptionReport();
    const plotSummary = plotReport.find((p) => p.plotId === testPlotId);
    expect(plotSummary).toBeDefined();
    expect(plotSummary!.totalHoursUsed).toBeGreaterThanOrEqual(5);
    expect(plotSummary!.machineBreakdown.length).toBeGreaterThan(0);
  });

  test("4. General and Petty Cash expense logging with MISC CropExpense sync", () => {
    // 1. General expense tagged to crop
    const genExp = addExpense({
      category: "GENERAL",
      amount: 2400,
      date: "2026-07-20",
      description: "Organic manure bio-culture delivery",
      plotId: testPlotId,
      cropCycleId: testCropCycleId,
      paidBy: "Bank NEFT",
    });

    const db = getDatabase();
    const syncedMisc = (db.cropExpenses || []).find((e) => e.sourceRefId === `expense_${genExp.id}`);
    expect(syncedMisc).toBeDefined();
    expect(syncedMisc?.category).toBe("MISC");
    expect(syncedMisc?.amount).toBe(2400);

    // 2. Summary report checks
    const summary = getExpenseSummaryReport();
    expect(summary.totalExpenses).toBeGreaterThanOrEqual(2400);
    expect(summary.taggedToCropCyclesTotal).toBeGreaterThanOrEqual(2400);
  });

  test("5. Petty cash running balance calculation and top-ups", () => {
    // Record top up
    const topUp = topUpPettyCash({
      amount: 10000,
      date: "2026-07-01",
      notes: "Initial cash replenishment",
    });
    expect(topUp.amountIn).toBeGreaterThanOrEqual(10000);

    // Record petty cash disbursements
    addExpense({
      category: "PETTY_CASH",
      amount: 850,
      date: "2026-07-02",
      description: "Farm tea, refreshments, and worker drinking water cans",
    });

    addExpense({
      category: "PETTY_CASH",
      amount: 1150,
      date: "2026-07-03",
      description: "Hardware store PVC fittings and Teflon tape",
    });

    recalculatePettyCashLedger();

    const status = getPettyCashStatus();
    expect(status.totalInflow).toBeGreaterThanOrEqual(10000);
    expect(status.totalOutflow).toBeGreaterThanOrEqual(2000);
    expect(status.currentBalance).toBe(status.totalInflow - status.totalOutflow);

    const ledger = getPettyCashLedger();
    expect(ledger.length).toBeGreaterThanOrEqual(2);
  });

  test("6. Consolidated report aggregator and CSV generation", () => {
    const report = getConsolidatedReport({
      plotId: testPlotId,
      cropCycleId: testCropCycleId,
    });

    expect(report.kpis).toBeDefined();
    expect(report.kpis.cropDirectExpenses).toBeGreaterThan(0);
    expect(report.ledger.length).toBeGreaterThan(0);

    // Verify CSV output format
    const csv = generateConsolidatedReportCsv({
      plotId: testPlotId,
    });
    expect(csv).toContain("Date,Stream,Plot,Crop,Category / Status,Description,Debit (Expense),Credit (Income)");
    expect(csv).toContain("MACHINERY");
  });
});
