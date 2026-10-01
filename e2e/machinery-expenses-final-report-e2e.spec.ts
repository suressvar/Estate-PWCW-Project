import { test, expect } from "@playwright/test";

test.describe("Epic: Machinery Register, Petty Cash Tracker & Final Consolidated Master Report", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "estate_authenticated", value: "true", domain: "localhost", path: "/" },
    ]);
  });

  test("1. Machinery Register: Register tractor, log usage with fuel and maintenance, verify report", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/machines");
    await expect(page.locator("h1")).toContainText("Machinery & Vehicle Register");

    // Register a new machine
    const timestamp = Date.now();
    const machineName = `Kubota B2441 Tractor ${timestamp}`;

    await page.click("#btn-register-machine-header");
    await expect(page.locator("text=Register Farm Equipment")).toBeVisible();
    await page.fill('input[placeholder*="John Deere"]', machineName);
    await page.fill('input[placeholder="TN-38-BZ-4412"]', `TN-38-KB-${timestamp % 10000}`);
    await page.click("#btn-save-machine-modal");

    // Switch to directory tab to verify machine
    await page.click('button:has-text("Machinery Register")');
    await expect(page.locator("body")).toContainText(machineName);

    // Log machine usage
    await page.click('button:has-text("Log Work Done")');
    await expect(page.locator("text=Log Machine Work Done")).toBeVisible();
    await page.selectOption("select >> nth=0", { label: `${machineName} (TRACTOR)` });
    await page.fill('input[type="date"]', "2026-07-16");
    await page.fill('textarea[placeholder*="Rotavator"]', "Rotary tilling on North block");
    await page.fill('input[placeholder="0"] >> nth=0', "1200"); // Fuel Spend
    await page.fill('input[placeholder="0"] >> nth=1', "300"); // Maintenance
    await page.click('button:has-text("Create Usage Log")');

    // Verify usage log is shown in Daily Usage Logs tab
    await page.click('button:has-text("Daily Usage Logs")');
    await expect(page.locator("body")).toContainText("Rotary tilling on North block");
    await expect(page.locator("body")).toContainText("₹1,200");
  });

  test("2. Expenses & Petty Cash: Top-up cash, record petty cash spend, verify running balance", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/expenses");
    await expect(page.locator("h1")).toContainText("General & Petty Cash Expense Tracker");
    await expect(page.locator("text=Live Petty Cash Balance")).toBeVisible();

    // Top up petty cash
    await page.click('button:has-text("Top Up Petty Cash")');
    await expect(page.locator("text=Top Up Petty Cash Drawer")).toBeVisible();
    await page.fill('input[placeholder*="5000"]', "7500");
    await page.click('button:has-text("Confirm Top Up")');

    // Record a petty cash expense
    await page.click('button:has-text("Petty Cash Spend")');
    await expect(page.locator("text=Record Farm Expense")).toBeVisible();
    await page.fill('input[placeholder*="750"]', "450");
    await page.fill(
      'textarea[placeholder*="Purchased PVC"]',
      "Urgent drip tape joiners and clamp clips"
    );
    await page.click('button:has-text("Record Expense")');

    // Verify expense in table
    await expect(page.locator("body")).toContainText("Urgent drip tape joiners and clamp clips");
    await expect(page.locator("body")).toContainText("₹450");

    // Check Daily Petty Cash Ledger tab
    await page.click('button:has-text("Daily Petty Cash Ledger")');
    await expect(page.locator("text=Day Book & Running Balance")).toBeVisible();
  });

  test("3. Consolidated Final Report: View master ledger, apply filters, and verify export link", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/reports/consolidated");
    await expect(page.locator("h1")).toContainText("Consolidated Estate Master Report");

    // Verify Master KPIs exist
    await expect(page.locator("text=Consolidated Income")).toBeVisible();
    await expect(page.locator("text=Total Consolidated Expenses")).toBeVisible();
    await expect(page.locator("text=Work Activity Completion")).toBeVisible();

    // Verify tabs
    await expect(page.locator('button:has-text("Master Unified Ledger")')).toBeVisible();
    await expect(page.locator('button:has-text("Crop Cycles Financials")')).toBeVisible();
    await expect(page.locator('button:has-text("Workforce & Wages")')).toBeVisible();
    await expect(page.locator('button:has-text("Machinery Operations")')).toBeVisible();
    await expect(page.locator('button:has-text("Daily Work Logs & Gaps")')).toBeVisible();

    // Switch between tabs
    await page.click('button:has-text("Crop Cycles Financials")');
    await expect(page.locator("text=Crop Cycle Seed-to-Harvest Financial P&L")).toBeVisible();

    await page.click('button:has-text("Workforce & Wages")');
    await expect(page.locator("text=Outstanding Wage Dues")).toBeVisible();

    await page.click('button:has-text("Machinery Operations")');
    await expect(page.locator("text=Machinery & Fleet Utilization")).toBeVisible();

    await page.click('button:has-text("Daily Work Logs & Gaps")');
    await expect(page.locator("text=Uncompleted / Carried Forward Work Activities")).toBeVisible();

    // Verify CSV button
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
  });
});
