import { test, expect } from "@playwright/test";

test.describe("Epic: Settings & Reset Operations", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
  });

  test("navigate to settings page and trigger a full database reset", async ({ page }) => {
    await page.goto("http://localhost:3000/settings");

    // 1. Verify page elements
    await expect(page.locator("main h1")).toContainText("System Settings");
    await expect(page.getByRole("button", { name: "Reset All Data" })).toBeVisible();

    // 2. Click Reset button to trigger modal
    await page.getByRole("button", { name: "Reset All Data" }).click();

    // 3. Verify modal is visible
    await expect(page.locator("body")).toContainText("Permanently Delete All Data?");
    
    // 4. Confirm deletion
    await page.getByRole("button", { name: "Yes, Reset All Data" }).click();

    // 5. Verify success alert/redirection
    await expect(page.locator("body")).toContainText("Data Successfully Reset");
    
    // 6. Wait for redirect to dashboard
    await page.waitForURL("http://localhost:3000/", { timeout: 5000 });
    await expect(page.locator("main h1")).toContainText("Executive Dashboard");
  });
});
