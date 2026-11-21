import { expect,test } from "./fixtures";
import { authenticate } from "./auth";

test.describe("Epic: Plot/Crop Master Data Management", () => {
  test.beforeEach(async ({ context }) => {
    await authenticate(context);
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

  test("assign multiple crops to a plot simultaneously via batch assignment modal", async ({ page, context }) => {
    const stamp = Date.now();
    const plotName = `Batch Plot ${stamp}`;
    const plotResponse = await context.request.post('/api/plots', { data: { name: plotName, location: 'Test', areaAcres: 12.5, status: 'ACTIVE' } });
    expect(plotResponse.ok()).toBeTruthy();
    const plot = await plotResponse.json();
    const cropNames = [`Coconut ${stamp}`, `Weeding ${stamp}`];
    for (const name of cropNames) {
      const response = await context.request.post('/api/crops', { data: { name, type: 'CROP' } });
      expect(response.ok()).toBeTruthy();
    }
    await page.goto("http://localhost:3000/plot-crops");
    await expect(page.locator("main h1")).toContainText("Plot-Crop Active Tracking Associations");

    // Open multi-crop assignment modal
    await page.click("#add-plot-crop-btn");

    await page.selectOption("#assoc-plot-select", plot.id);

    // Select multiple crops via the interactive checkbox grid inside the form modal
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    for (const name of cropNames) {
      const checkbox = page.getByTestId(`crop-checkbox-${name}`);
      await expect(checkbox).not.toBeChecked();
      await checkbox.click();
      await expect(checkbox).toBeChecked();
    }

    // Submit assignment
    await page.click("#save-assoc-btn");

    await expect(page.locator("table")).toContainText(plotName);
    for (const name of cropNames) await expect(page.locator('table')).toContainText(name);
  });

  test("verify Plots, Crops, and Plot-Crops are inside a single menu Plots-Crops in the sidebar", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    const sidebar = page.locator("aside");
    // Verify single top-level Plots-Crops menu item
    await expect(sidebar.getByText("Plots & Crops")).toBeVisible();

    // Open the accordion menu
    await sidebar.getByText("Plots & Crops").click();

    // Verify sub-menu items are accessible under Plots-Crops
    await expect(sidebar.getByRole("link", { name: "Plot-Crops Tracking" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Plots Master" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Crops & Activities" })).toBeVisible();

    // Navigate to Plots Master via submenu link
    await sidebar.getByRole("link", { name: "Plots Master" }).click();
    await expect(page).toHaveURL("http://localhost:3000/plots");
    await expect(page.locator("main h1")).toContainText("Plot Master Data Management");

    // Navigate to Crops via submenu link
    await sidebar.getByRole("link", { name: "Crops & Activities" }).click();
    await expect(page).toHaveURL("http://localhost:3000/crops");
    await expect(page.locator("main h1")).toContainText("Crops & Activities Master Data");
  });
});



