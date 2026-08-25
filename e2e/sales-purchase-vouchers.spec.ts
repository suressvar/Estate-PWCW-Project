import { test, expect } from "@playwright/test";

test.describe("Epic: Sales & Purchases Voucher Format System", () => {
  test.beforeEach(async ({ context }) => {
    await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
  });

  test("1. Sidebar navigation contains Sales & Purchases accordion with Sales and Purchases submenus", async ({ page }) => {
    await page.goto("http://localhost:3000/");

    const sidebar = page.locator("aside");
    // Verify parent menu 'Sales & Purchases' exists
    await expect(sidebar.getByText("Sales & Purchases")).toBeVisible();

    // Verify sub-menu items
    await expect(sidebar.getByRole("link", { name: "Sales" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Purchases" })).toBeVisible();

    // Navigate to Sales
    await sidebar.getByRole("link", { name: "Sales" }).click();
    await expect(page).toHaveURL("http://localhost:3000/sales");
    await expect(page.locator("main h1")).toContainText("Crop Sales & Revenue Logs (Voucher Format)");

    // Navigate to Purchases
    await sidebar.getByRole("link", { name: "Purchases" }).click();
    await expect(page).toHaveURL("http://localhost:3000/purchases");
    await expect(page.locator("main h1")).toContainText("Estate Purchases & Procurement (Voucher Format)");
  });

  test("2. Create a new Sales Voucher with itemized produce and verify in ledger", async ({ page }) => {
    await page.goto("http://localhost:3000/sales");

    // Fill customer and line item particulars
    await page.fill("#sales-buyer-input", "Coimbatore Mega Agro Mandi");
    await page.fill("#sales-qty-input", "800");
    await page.fill("#sales-val-input", "36000");

    // Submit Sales Voucher
    await page.click("#form-submit-btn");

    // Verify in Sales Voucher ledger table
    const ledgerTable = page.locator("table").last();
    await expect(ledgerTable).toContainText("Coimbatore Mega Agro Mandi");
    await expect(ledgerTable).toContainText("800 kg");
    await expect(ledgerTable).toContainText("₹36000");
  });

  test("3. Open and inspect official printable Sales Voucher Slip with Letterhead and Amount in Words", async ({ page }) => {
    await page.goto("http://localhost:3000/sales");

    // Click on first voucher in table to open voucher slip
    await page.locator("table button:has-text('SLS-')").first().click();

    // Verify modal elements
    const voucherModal = page.locator("#voucher-printable-area");
    await expect(voucherModal).toBeVisible();
    await expect(voucherModal).toContainText("Ranga Estate");
    await expect(voucherModal).toContainText("OFFICIAL SALES VOUCHER");
    await expect(voucherModal).toContainText("Billed To / Buyer Details");
    await expect(voucherModal).toContainText("Amount Chargeable in Words");
    await expect(voucherModal).toContainText("Prepared / Logged By");
    await expect(voucherModal).toContainText("Estate Manager");
  });

  test("4. Create a new Purchase Voucher and verify in purchase ledger and slip", async ({ page }) => {
    await page.goto("http://localhost:3000/purchases");

    // Fill purchase form
    await page.fill('input[placeholder="e.g. Sri Murugan Agro Agencies"]', "Greenfield Agro Spares");
    await page.fill('input[placeholder="e.g. Drip Irrigation Pipe Fittings"]', "High Pressure Valve Replacements");

    // Submit purchase voucher
    await page.click('button:has-text("Generate & Save Official Purchase Voucher")');

    // Verify in ledger
    const ledgerTable = page.locator("table").last();
    await expect(ledgerTable).toContainText("Greenfield Agro Spares");
    await expect(ledgerTable).toContainText("High Pressure Valve Replacements");

    // Open voucher slip
    await page.locator("table button:has-text('PUR-')").first().click();

    const voucherModal = page.locator("#voucher-printable-area");
    await expect(voucherModal).toBeVisible();
    await expect(voucherModal).toContainText("Ranga Estate");
    await expect(voucherModal).toContainText("OFFICIAL PURCHASE VOUCHER");
    await expect(voucherModal).toContainText("Vendor / Supplier Details");
  });
});
