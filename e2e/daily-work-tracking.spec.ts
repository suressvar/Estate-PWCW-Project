import { expect,test } from "@playwright/test";
import { authenticate } from "./auth";

test.describe("Epic: Daily Work Tracking & Operations Module", () => {
  test.beforeEach(async ({ context }) => {
    await authenticate(context);
  });

  test("1. Navigate to Daily Work Log, add planned activities, toggle Done and Not Done with reason", async ({ page }) => {
    await page.goto("http://localhost:3000/daily-log");
    await page.click("#tab-task-board");
    await expect(page.locator("main h1")).toContainText("Daily Work Tracking");

    // Select Plot A - North Field
    await page.selectOption("#plot-select", { index: 0 });

    // Open Add Activity modal
    await page.click("#add-activity-btn");
    await expect(page.locator("text=Add Work Activity")).toBeVisible();

    // Fill form for Activity 1: Irrigation
    await page.selectOption("#activity-type-select", "IRRIGATION");
    await page.fill("#activity-desc-input", "Main pipeline drip irrigation - block 2");
    await page.click("#save-activity-btn");

    // Verify activity appears in list
    await expect(page.locator("body")).toContainText("Main pipeline drip irrigation - block 2");

    // Mark Activity 1 as DONE
    const doneBtn = page.locator('button[id^="status-toggle-done-"]').first();
    await doneBtn.click();
    await expect(doneBtn).toHaveClass(/bg-emerald-600/);

    // Add Activity 2: Spraying
    await page.click("#add-activity-btn");
    await page.selectOption("#activity-type-select", "SPRAYING");
    await page.fill("#activity-desc-input", "Organic fungicide spray row 1 to 20");
    await page.click("#save-activity-btn");

    // Verify Activity 2 appears
    await expect(page.locator("body")).toContainText("Organic fungicide spray row 1 to 20");

    // Click Not Done for Activity 2
    const notDoneBtn = page.locator('button[id^="status-toggle-not-done-"]').last();
    await notDoneBtn.click();

    // Verify Reason Required modal appears
    await expect(page.locator("text=Reason Required")).toBeVisible();

    // Try submitting without reason (should show error)
    await page.click("#save-reason-btn");
    await expect(page.locator("text=A valid reason is mandatory")).toBeVisible();

    // Fill valid reason and submit
    await page.fill("#reason-not-done-input", "Spraying equipment pressure pump failure");
    await page.click("#save-reason-btn");

    // Verify Reason Not Done displays on activity card
    await expect(page.locator("body")).toContainText("Spraying equipment pressure pump failure");
  });

  test("2. Carry-forward unfinished activities and verify executive dashboard", async ({ page }) => {
    // 1. Visit /daily-log and trigger carry-forward
    await page.goto("http://localhost:3000/daily-log");
    await expect(page.locator("main h1")).toContainText("Daily Work Tracking");

    await page.click("#run-carry-forward-btn");
    await expect(page.locator("#action-feedback-alert")).toBeVisible();

    // 2. Navigate to Dashboard home and verify executive overview loads without daily work log
    await page.goto("http://localhost:3000");
    await expect(page.locator("main h1")).toContainText("Executive Dashboard");
    await expect(page.locator("#daily-work-summary-widget")).toHaveCount(0);
  });
});
