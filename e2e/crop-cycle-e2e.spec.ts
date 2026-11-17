import { expect,test } from "@playwright/test";
import { authenticate } from "./auth";

test.describe("Epic: Seed-to-Harvest Financial Ledger per Plot & Crop Cycle", () => {
  test.beforeEach(async ({ context }) => {
    await authenticate(context);
  });

  test("Create a crop cycle, add 3 expenses and 2 incomes, verify exact P&L on detail page and plot rollup", async ({
    page, context,
  }) => {
    const plotName = `Crop Ledger Plot ${Date.now()}`;
    const response = await context.request.post('/api/plots', { data: { name: plotName, location: 'Test', areaAcres: 5, status: 'ACTIVE' } });
    expect(response.ok()).toBeTruthy();
    const plot = await response.json();
    // 1. Navigate to Crop Cycles Overview
    await page.goto("http://localhost:3000/crop-cycles");
    await expect(page.locator("main h1")).toContainText("Crop Cycles Financial Performance");

    // 2. Open New Crop Cycle Modal
    await page.click("#new-crop-cycle-btn");
    await expect(page.locator("text=Start New Crop Cycle")).toBeVisible();

    // Fill new cycle form
    const uniqueCycleName = `Tomato Monsoon 2026 - ${Date.now()}`;
    await page.selectOption('#cycle-plot-select', plot.id);
    await page.fill("#cycle-crop-name-input", uniqueCycleName);
    await page.fill("#cycle-crop-type-input", "Vegetables");
    await page.fill("#cycle-sowing-date-input", "2026-06-01");
    await page.fill("#cycle-expected-harvest-input", "2026-08-30");
    await page.click("#save-crop-cycle-btn");

    // Verify newly created cycle appears in grid
    await expect(page.locator("body")).toContainText(uniqueCycleName);

    // 3. Open Detail Page for the new cycle
    const cycleCard = page.locator("#crop-cycles-grid > div", { hasText: uniqueCycleName });
    await cycleCard.locator('a:has-text("View Ledger & Analytics")').click();
    await expect(page.locator("#cycle-detail-title")).toContainText(uniqueCycleName);


    // 4. Add Expense 1: Seeds (₹4,500)
    await page.click("#add-expense-modal-btn");
    await expect(page.locator("text=Log Crop Cycle Expense")).toBeVisible();
    await page.selectOption("#expense-cat-select", "SEEDS");
    await page.fill("#expense-amount-input", "4500");
    await page.fill("#expense-date-input", "2026-06-02");
    await page.fill("#expense-desc-input", "Shivam F1 Hybrid Tomato Seeds");
    await page.click("#save-expense-btn");
    await expect(page.locator("body")).toContainText("Shivam F1 Hybrid Tomato Seeds");

    // 5. Add Expense 2: Fertilizer (₹8,200)
    await page.click("#add-expense-modal-btn");
    await page.selectOption("#expense-cat-select", "FERTILIZER");
    await page.fill("#expense-amount-input", "8200");
    await page.fill("#expense-date-input", "2026-06-20");
    await page.fill("#expense-desc-input", "DAP and 19-19-19 fertigation");
    await page.click("#save-expense-btn");
    await expect(page.locator("body")).toContainText("DAP and 19-19-19 fertigation");

    // 6. Add Expense 3: Labor (₹6,300) -> Total Expenses = ₹19,000
    await page.click("#add-expense-modal-btn");
    await page.selectOption("#expense-cat-select", "LABOR");
    await page.fill("#expense-amount-input", "6300");
    await page.fill("#expense-date-input", "2026-07-15");
    await page.fill("#expense-desc-input", "Trellising & inter-row weeding crew");
    await page.click("#save-expense-btn");
    await expect(page.locator("body")).toContainText("Trellising & inter-row weeding crew");

    // Verify Total Expenses equals ₹19,000
    await expect(page.locator("body")).toContainText("₹19,000");

    // 7. Add Income 1: Market Sale (1500 kg @ ₹18 = ₹27,000)
    await page.click("#add-income-modal-btn");
    await expect(page.locator("text=Log Harvest Sale Income")).toBeVisible();
    await page.selectOption("#income-source-select", "MARKET_SALE");
    await page.fill("#income-qty-input", "1500");
    await page.fill("#income-unit-input", "kg");
    await page.fill("#income-rate-input", "18");
    await page.fill("#income-date-input", "2026-08-20");
    await page.fill("#income-buyer-input", "Global Agritech Mandi");
    await page.click("#save-income-btn");
    await page.click("#tab-btn-incomes");
    await expect(page.locator("body")).toContainText("Global Agritech Mandi");

    // 8. Add Income 2: Direct Buyer (800 kg @ ₹20 = ₹16,000) -> Total Income = ₹43,000
    await page.click("#add-income-modal-btn");
    await page.selectOption("#income-source-select", "DIRECT_BUYER");
    await page.fill("#income-qty-input", "800");
    await page.fill("#income-unit-input", "kg");
    await page.fill("#income-rate-input", "20");
    await page.fill("#income-date-input", "2026-08-26");
    await page.fill("#income-buyer-input", "Fresh Harvest Stores");
    await page.click("#save-income-btn");
    await page.click("#tab-btn-incomes");
    await expect(page.locator("body")).toContainText("Fresh Harvest Stores");

    // 9. Verify Financial Ledger on Detail Page:
    // Total Expenses = ₹19,000
    // Total Revenue = ₹43,000
    // Net Profit = ₹24,000 (43,000 - 19,000)
    await expect(page.locator("body")).toContainText("₹19,000");
    await expect(page.locator("body")).toContainText("₹43,000");
    await expect(page.locator("body")).toContainText("₹24,000");
    await expect(page.locator("body")).toContainText("PROFIT");

    // 10. Navigate back to Plot-level rollup view
    await page.goto("http://localhost:3000/crop-cycles");
    await expect(page.locator("#plot-rollups-table")).toBeVisible();

    // Verify plot table and grid display updated totals
    await expect(page.locator("#plot-rollups-table")).toContainText(plotName);
    await expect(page.locator("#crop-cycles-grid")).toContainText(uniqueCycleName);
    await expect(page.locator("#crop-cycles-grid")).toContainText("₹19,000");
    await expect(page.locator("#crop-cycles-grid")).toContainText("₹43,000");
    await expect(page.locator("#crop-cycles-grid")).toContainText("₹24,000");
  });
});
