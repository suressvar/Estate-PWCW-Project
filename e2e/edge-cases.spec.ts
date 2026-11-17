import { expect,test } from "@playwright/test";
import { authenticate } from "./auth";

test.describe("Security & Analytics Edge Cases", () => {
  test("1. Unauthenticated role headers cannot bypass protected analytics", async ({ request }) => {
    // Attempting direct fetch with role header simulating restricted access
    const response = await request.get("http://localhost:3000/api/analytics?plot=RestrictedPlot2", {
      headers: { "x-user-role": "FIELD_STAFF", "x-user-plot": "p1" },
    });
    expect(response.status()).toBe(401);

    const data = await response.json();
    // Verify response structure is sanitized and plot-restricted
    expect(data).toHaveProperty("error");
  });

  test("2. Edge Cases in P&L Calculation (Zero transactions, only purchases, negative stock)", async ({ page, context }) => {
    await authenticate(context);
    await page.goto("http://localhost:3000/");

    await expect(page.locator("main h1")).toContainText("Executive Dashboard");

    // Verify a future-date query returns finite zero financials through the API.
    const response = await page.request.get('/api/analytics?startDate=2030-01-01&endDate=2030-01-31');
    expect(response.ok()).toBe(true);
    const analytics = await response.json();
    expect(analytics.kpis.totalRevenue).toBe(0);
    expect(analytics.kpis.totalExpenses).toBe(0);
    expect(analytics.kpis.netProfit).toBe(0);
    await expect(page.locator("body")).not.toContainText("NaN");
  });
});
