import { expect,test } from "@playwright/test";
import {
addCropExpense,
addCropIncome,
createCropCycle,
getCropCycleFinancials,
getPlotFinancialRollup,
syncOperationsToCropCycle,
validateCropCycleDateRange,
} from "../src/lib/crop-cycle-data";
import { createPlot,getPlots } from "../src/lib/master-data";

test.describe("Crop Cycle Financial Ledger - Unit & Integration Logic", () => {
  let testPlotId = "p1";

  test.beforeAll(() => {
    const plots = getPlots();
    if (plots && plots.length > 0) {
      testPlotId = plots[0].id;
    } else {
      const p = createPlot({ name: "Plot A - North Field", location: "North", areaAcres: 12.5, status: "ACTIVE" });
      testPlotId = p.id;
    }
  });

  test("1. Sum and financial rollup logic: 3 expenses and 2 incomes calculation", () => {
    const cycle = createCropCycle({
      plotId: testPlotId,
      cropName: "Chilli (Teja Hybrid)",
      cropType: "Spices",
      sowingDate: "2026-05-01",
      expectedHarvestDate: "2026-09-01",
      actualHarvestDate: "2026-08-28",
      status: "HARVESTED",
    });

    // 3 Expenses: ₹4,500 + ₹8,200 + ₹6,300 = ₹19,000
    addCropExpense({
      cropCycleId: cycle.id,
      category: "SEEDS",
      amount: 4500,
      date: "2026-05-02",
      description: "Hybrid Teja Chilli seeds",
    });
    addCropExpense({
      cropCycleId: cycle.id,
      category: "FERTILIZER",
      amount: 8200,
      date: "2026-05-20",
      description: "19-19-19 and Micronutrient foliar spray",
    });
    addCropExpense({
      cropCycleId: cycle.id,
      category: "LABOR",
      amount: 6300,
      date: "2026-06-15",
      description: "Weeding and staking",
    });

    // 2 Incomes: (1500 kg @ ₹18 = ₹27,000) + (800 kg @ ₹20 = ₹16,000) = ₹43,000
    addCropIncome({
      cropCycleId: cycle.id,
      source: "MARKET_SALE",
      quantitySold: 1500,
      unit: "kg",
      ratePerUnit: 18,
      date: "2026-08-15",
      buyerName: "Local Mandi",
    });
    addCropIncome({
      cropCycleId: cycle.id,
      source: "DIRECT_BUYER",
      quantitySold: 800,
      unit: "kg",
      ratePerUnit: 20,
      date: "2026-08-26",
      buyerName: "Spice Traders Co",
    });

    const financials = getCropCycleFinancials(cycle.id);
    expect(financials).toBeDefined();

    // Verify exact mathematical totals
    expect(financials?.totalExpenses).toBe(19000);
    expect(financials?.totalIncome).toBe(43000);
    expect(financials?.netProfitLoss).toBe(24000); // 43,000 - 19,000 = 24,000
    expect(financials?.isProfitable).toBe(true);

    // Verify ROI & Margins
    // ROI = (24000 / 19000) * 100 = 126.3%
    expect(financials?.roiPercent).toBeCloseTo(126.3, 0);
    // Margin = (24000 / 43000) * 100 = 55.8%
    expect(financials?.profitMarginPercent).toBeCloseTo(55.8, 0);

    // Verify Category Breakdowns
    expect(financials?.expenseBreakdown.length).toBe(3);
    expect(financials?.expenseBreakdown[0].category).toBe("FERTILIZER"); // highest expense (8200)
    expect(financials?.incomeBreakdown.length).toBe(2);
    expect(financials?.incomeBreakdown[0].source).toBe("MARKET_SALE"); // highest income (27000)
  });

  test("2. Edge Case: Only expenses incurred, zero harvest income yet (Net Loss calculation)", () => {
    const cycle = createCropCycle({
      plotId: testPlotId,
      cropName: "Watermelon (Sugar Baby)",
      sowingDate: "2026-07-01",
      expectedHarvestDate: "2026-10-01",
      status: "GROWING",
    });

    addCropExpense({
      cropCycleId: cycle.id,
      category: "SEEDS",
      amount: 3000,
      date: "2026-07-01",
      description: "Sugar baby seeds",
    });
    addCropExpense({
      cropCycleId: cycle.id,
      category: "IRRIGATION",
      amount: 2500,
      date: "2026-07-10",
      description: "Drip fittings and mulch roll",
    });

    const financials = getCropCycleFinancials(cycle.id);
    expect(financials?.totalExpenses).toBe(5500);
    expect(financials?.totalIncome).toBe(0);
    expect(financials?.netProfitLoss).toBe(-5500);
    expect(financials?.isProfitable).toBe(false);
    expect(financials?.profitMarginPercent).toBe(0);
  });

  test("3. Plot-Level Lifetime Rollup across multiple crop cycles", () => {
    const plotRollup = getPlotFinancialRollup(testPlotId);
    expect(plotRollup).toBeDefined();
    expect(plotRollup?.plotId).toBe(testPlotId);
    expect(plotRollup?.totalCyclesCount).toBeGreaterThanOrEqual(2);

    // Verify lifetime sums match sum of child cycles
    const manualExpenseSum = plotRollup?.cycles.reduce((s, c) => s + c.totalExpenses, 0);
    const manualIncomeSum = plotRollup?.cycles.reduce((s, c) => s + c.totalIncome, 0);

    expect(plotRollup?.lifetimeExpenses).toBe(manualExpenseSum);
    expect(plotRollup?.lifetimeIncome).toBe(manualIncomeSum);
    expect(plotRollup?.lifetimeProfitLoss).toBe(
      (manualIncomeSum || 0) - (manualExpenseSum || 0)
    );
  });

  test("4. Non-blocking date range validation warnings", () => {
    const cycle = createCropCycle({
      plotId: testPlotId,
      cropName: "Brinjal Test",
      sowingDate: "2026-08-01",
      expectedHarvestDate: "2026-11-01",
    });

    // Valid date within cycle
    const valid = validateCropCycleDateRange(cycle, "2026-08-15");
    expect(valid.isWithinRange).toBe(true);
    expect(valid.warning).toBeUndefined();

    // Date far before sowing
    const tooEarly = validateCropCycleDateRange(cycle, "2026-01-01");
    expect(tooEarly.isWithinRange).toBe(false);
    expect(tooEarly.warning).toBeDefined();
    expect(tooEarly.warning).toContain("standard cycle window");

    // Adding expense with out-of-range date should succeed with warning attached
    const result = addCropExpense({
      cropCycleId: cycle.id,
      category: "MISC",
      amount: 1200,
      date: "2026-01-01",
      description: "Prior season land clearance",
    });
    expect(result.expense).toBeDefined();
    expect(result.warning).toBeDefined();
  });

  test("5. Idempotent operational sync from labor and machinery logs", () => {
    const cycle = createCropCycle({
      plotId: testPlotId,
      cropName: "Operational Sync Test",
      sowingDate: "2026-07-01",
      expectedHarvestDate: "2026-07-31",
    });

    // First sync
    const firstSync = syncOperationsToCropCycle(cycle.id);
    expect(firstSync.syncedCount).toBeGreaterThanOrEqual(0);

    // Second sync: should be idempotent and not create duplicate entries
    const secondSync = syncOperationsToCropCycle(cycle.id);
    expect(secondSync.syncedCount).toBe(0); // No new duplicates
  });
});
