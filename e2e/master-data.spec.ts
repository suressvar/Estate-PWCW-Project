import { test, expect } from "@playwright/test";

test.describe("Epic: Plot/Crop Master Data Management", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
  });

  test("create a plot, create a crop, assign crop to plot, verify in plot_crops list", async ({ page }) => {

    // 1. Navigate to Plots page and create a new plot
    await page.goto("http://localhost:3000/plots");
    await expect(page.locator("main h1")).toContainText("Plot Master Data Management");

    await page.click("#add-plot-btn");
    await page.fill("#plot-name-input", "Plot E - Test Orchard");
    await page.fill("#plot-location-input", "East Sector Block");
    await page.fill("#plot-area-input", "18.5");
    await page.click("#save-plot-btn");

    // Verify Plot appears in table
    await expect(page.locator("body")).toContainText("Plot E - Test Orchard");

    // 2. Navigate to Crops page and create a new crop
    await page.goto("http://localhost:3000/crops");
    await expect(page.locator("main h1")).toContainText("Crops & Activities Master Data");

    await page.click("#add-crop-btn");
    await page.fill("#crop-name-input", "Mango Harvest");
    await page.click("#save-crop-btn");

    // Verify Crop appears in table
    await expect(page.locator("body")).toContainText("Mango Harvest");

    // 3. Navigate to Plot-Crops page and assign crop to plot
    await page.goto("http://localhost:3000/plot-crops");
    await expect(page.locator("main h1")).toContainText("Plot-Crop Active Tracking Associations");

    await page.click("#add-plot-crop-btn");
    await page.selectOption("#assoc-plot-select", { label: "Plot E - Test Orchard (18.5 Acres)" });
    await page.selectOption("#assoc-crop-select", { label: "Mango Harvest [CROP]" });
    await page.click("#save-assoc-btn");

    // 4. Verify new plot-crop association appears in table
    await expect(page.locator("table")).toContainText("Plot E - Test Orchard");
    await expect(page.locator("table")).toContainText("Mango Harvest");
  });
});


