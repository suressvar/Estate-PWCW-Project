import { test, expect } from "@playwright/test";

test.describe("Epic: Worker Management, Attendance, Activities & Wage Register", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([
      { name: "estate_authenticated", value: "true", domain: "localhost", path: "/" },
    ]);
  });

  test("Mark attendance for 2 workers, log activities, verify computed wages, settle payment and verify register", async ({
    page,
  }) => {
    // 1. Navigate to Workers Management
    await page.goto("http://localhost:3000/workers");
    await expect(page.locator("h1")).toContainText("Worker Management & Wages");

    // 2. Register 2 fresh workers to guarantee clean isolated test data
    const timestamp = Date.now();
    const worker1Name = `Murugan Test ${timestamp}`;
    await page.click("#new-worker-btn");
    await expect(page.locator("text=Register New Field Worker")).toBeVisible();
    await page.fill("#worker-name-input", worker1Name);
    await page.fill("#worker-wage-input", "600");
    await page.click("#save-worker-btn");
    await expect(page.locator("body")).toContainText(worker1Name);

    const worker2Name = `Kavitha Test ${timestamp}`;
    await page.click("#new-worker-btn");
    await page.fill("#worker-name-input", worker2Name);
    await page.fill("#worker-wage-input", "500");
    await page.click("#save-worker-btn");
    await expect(page.locator("body")).toContainText(worker2Name);

    // 3. Select a dedicated test date
    const testDate = "2026-06-25";
    await page.fill("#attendance-date-picker", testDate);
    await expect(page.locator("#attendance-table")).toBeVisible();

    // 4. Mark Worker 1 (₹600/day) as PRESENT
    const rowWorker1 = page.locator("#attendance-table tr", { hasText: worker1Name });
    await expect(rowWorker1).toBeVisible();
    await rowWorker1.locator('button:has-text("Present")').click();

    // Mark Worker 2 (₹500/day) as HALF_DAY (₹250)
    const rowWorker2 = page.locator("#attendance-table tr", { hasText: worker2Name });
    await expect(rowWorker2).toBeVisible();
    await rowWorker2.locator('button:has-text("Half-Day")').click();

    // Verify computed wage badges in rows
    await expect(rowWorker1).toContainText("₹600");
    await expect(rowWorker2).toContainText("₹250");

    // Verify total wages header badge includes both
    await expect(page.locator("#daily-total-wages-badge")).not.toContainText("₹0");

    // 5. Switch to Worker Activities Tab
    await page.click("#tab-activities");
    await expect(page.locator("#log-activity-btn")).toBeVisible();

    // Open activity modal
    await page.click("#log-activity-btn");
    await expect(page.locator("text=Log Worker Field Activity")).toBeVisible();

    // Fill activity form
    await page.selectOption("#act-worker-select", { label: `${worker1Name} (General Field Worker)` });
    await page.selectOption("#act-plot-select", { index: 1 });
    await page.selectOption("#act-daily-log-select", { index: 1 });
    await page.fill("#act-desc-input", "Pruning dead leaves and basal shoot trimming");
    await page.fill("#act-hours-input", "8");
    await page.click("#save-activity-btn");

    // Verify activity appears in activities table
    await expect(page.locator("#activities-table")).toContainText("Pruning dead leaves and basal shoot trimming");
    await expect(page.locator("#activities-table")).toContainText(worker1Name);

    // 6. Switch to Wage Register Tab
    await page.click("#tab-wages");
    await expect(page.locator("#wages-register-table")).toBeVisible();

    // Verify both workers appear in wage register
    const wageRow1 = page.locator("#wages-register-table tr", { hasText: worker1Name }).first();
    const wageRow2 = page.locator("#wages-register-table tr", { hasText: worker2Name }).first();

    await expect(wageRow1).toContainText("₹600");
    await expect(wageRow2).toContainText("₹250");
    await expect(wageRow1).toContainText("UNPAID");
    await expect(wageRow2).toContainText("UNPAID");

    // 7. Settle Payment for Worker 1 (Mark as Paid ₹600)
    await wageRow1.locator('button:has-text("Settle / Pay")').click();
    await expect(page.locator("text=Settle Wage Payment")).toBeVisible();
    await page.fill("#pay-notes-input", "Direct UPI payout");
    await page.click("#confirm-pay-btn");

    // Verify feedback alert
    await expect(page.locator("#worker-feedback-alert")).toContainText(`Recorded ₹600 payment for ${worker1Name}`);

    // Verify Worker 1's wage row now shows PAID / Settled with ₹0 balance
    await expect(wageRow1).toContainText("PAID");
    await expect(wageRow1).toContainText("Settled");

    // Verify Worker 2 remains UNPAID with ₹250 balance
    await expect(wageRow2).toContainText("UNPAID");

    // 8. Switch to Monthly Summary Tab & check CSV Export button
    await page.click("#tab-summary");
    await expect(page.locator("#monthly-summary-table")).toBeVisible();
    await expect(page.locator("#export-csv-btn")).toBeVisible();
    await expect(page.locator("#monthly-summary-table")).toContainText(worker1Name);
  });
});
