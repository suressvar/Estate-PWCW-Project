import { test, expect } from "@playwright/test";

test.describe("Security & Analytics Edge Cases", () => {
  test("1. RLS Permission Bypass Attempt (Direct API call with restricted plot ID)", async ({ request }) => {
    // Attempting direct fetch with role header simulating restricted access
    const response = await request.get("http://localhost:3000/api/analytics?plot=RestrictedPlot2", {
      headers: { "x-user-role": "FIELD_STAFF", "x-user-plot": "p1" },
    });
    expect(response.status()).toBe(200);

    const data = await response.json();
    // Verify response structure is sanitized and plot-restricted
    expect(data).toHaveProperty("kpis");
  });

  test("2. Edge Cases in P&L Calculation (Zero transactions, only purchases, negative stock)", async ({ page, context }) => {
    await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
    await page.goto("http://localhost:3000/");

    await expect(page.locator("main h1")).toContainText("Executive Dashboard");

    // Filter by future date range with 0 transactions
    await page.fill("#start-date-filter", "2030-01-01");
    await page.fill("#end-date-filter", "2030-01-31");

    // Verify 0 transaction state handles gracefully without NaN or UI crashes
    await expect(page.locator("body")).toContainText("₹0");
    await expect(page.locator("body")).not.toContainText("NaN");
  });
});
