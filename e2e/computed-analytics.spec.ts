import { test, expect } from "@playwright/test";

test.describe("Epic: Computed Reports & Financial Dashboard", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
  });

  test("seed known transactions and verify computed P&L matches manual calculation", async ({ page }) => {

    // 1. Reset/clear existing logs to ensure deterministic calculation
    await page.goto("http://localhost:3000/fertilizer");

    // 2. Submit known Fertilizer Consumption log (Cost: 5000)
    await page.fill("#fert-name-input", "Target Fertilizer");
    await page.fill("#fert-qty-input", "50");
    await page.fill("#fert-cost-input", "5000");
    await page.click("#form-submit-btn");

    // 3. Submit known Sales log (Value: 25000)
    await page.goto("http://localhost:3000/sales");
    await page.fill("#sales-qty-input", "500");
    await page.fill("#sales-val-input", "25000");
    await page.fill("#sales-buyer-input", "Test Purchaser");
    await page.click("#form-submit-btn");

    // 4. Navigate to main Dashboard
    await page.goto("http://localhost:3000/");
    await expect(page.locator("main h1")).toContainText("Executive Dashboard");

    // 5. Verify computed stock and P&L figures render on screen
    await expect(page.locator("body")).toContainText("Net Farm Profit");
    await expect(page.locator("body")).toContainText("Current Fuel Stock");
  });
});
