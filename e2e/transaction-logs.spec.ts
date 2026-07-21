import { test, expect } from "@playwright/test";

test.describe("Epic: Transaction Logging Forms", () => {
  test("1. Submit Fertilizer Log entry and verify in history", async ({ page }) => {
    await page.goto("http://localhost:3000/fertilizer");
    await expect(page.locator("main h1")).toContainText("Fertilizer Logs");

    await page.fill("#fert-name-input", "Urea 46% N");
    await page.fill("#fert-qty-input", "100");
    await page.fill("#fert-cost-input", "4200");
    await page.click("#form-submit-btn");

    await expect(page.locator("table")).toContainText("Urea 46% N");
    await expect(page.locator("table")).toContainText("100 kg");
  });

  test("2. Submit Diesel Log entry and verify in history", async ({ page }) => {
    await page.goto("http://localhost:3000/diesel");
    await expect(page.locator("main h1")).toContainText("Diesel Fuel Logs");

    await page.fill("#diesel-qty-input", "150");
    await page.fill("#diesel-cost-input", "14250");
    await page.click("#form-submit-btn");

    await expect(page.locator("table")).toContainText("150 L");
    await expect(page.locator("table")).toContainText("₹14250");
  });

  test("3. Submit Machinery Log with auto-calculated runtime & diesel", async ({ page }) => {
    await page.goto("http://localhost:3000/machinery");
    await expect(page.locator("main h1")).toContainText("Machinery Usage");

    await page.selectOption("#machine-select", "John Deere Tractor");
    await page.fill("#start-time-input", "08:00");
    await page.fill("#end-time-input", "12:00");
    await page.click("#form-submit-btn");

    await expect(page.locator("table")).toContainText("John Deere Tractor");
    await expect(page.locator("table")).toContainText("4 hrs");
  });

  test("4. Submit Labor Log with auto-calculated total wages", async ({ page }) => {
    await page.goto("http://localhost:3000/labor");
    await expect(page.locator("main h1")).toContainText("Labor Usage");

    await page.fill("#men-count-input", "5");
    await page.fill("#men-wage-input", "600");
    await page.fill("#women-count-input", "5");
    await page.fill("#women-wage-input", "400");
    await page.click("#form-submit-btn");

    await expect(page.locator("table")).toContainText("5 Men");
    await expect(page.locator("table")).toContainText("5 Women");
    await expect(page.locator("table")).toContainText("₹5000");
  });

  test("5. Submit Production Log entry and verify in history", async ({ page }) => {
    await page.goto("http://localhost:3000/production");
    await expect(page.locator("main h1")).toContainText("Crop Production");

    await page.fill("#prod-qty-input", "850");
    await page.click("#form-submit-btn");

    await expect(page.locator("table")).toContainText("850 kg");
  });

  test("6. Submit Sales Log entry and verify in history", async ({ page }) => {
    await page.goto("http://localhost:3000/sales");
    await expect(page.locator("main h1")).toContainText("Crop Sales");

    await page.fill("#sales-qty-input", "750");
    await page.fill("#sales-val-input", "33750");
    await page.fill("#sales-buyer-input", "Global Agritech Mandi");
    await page.click("#form-submit-btn");

    await expect(page.locator("table")).toContainText("Global Agritech Mandi");
    await expect(page.locator("table")).toContainText("₹33750");
  });
});

