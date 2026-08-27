# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: transaction-logs.spec.ts >> Epic: Transaction Logging Forms >> 6. Submit Sales Log entry and verify in history
- Location: e2e\transaction-logs.spec.ts:72:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('main h1')
Expected substring: "Crop Sales"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('main h1')

```

```yaml
- navigation:
  - button "previous" [disabled]:
    - img "previous"
  - text: 1/1
  - button "next" [disabled]:
    - img "next"
- img
- link "Next.js 16.2.10 (stale) Turbopack":
  - /url: https://nextjs.org/docs/messages/version-staleness
  - img
  - text: Next.js 16.2.10 (stale) Turbopack
- img
- dialog "Build Error":
  - text: Build Error
  - button "Copy Error Info":
    - img
  - link "Go to related documentation":
    - /url: https://nextjs.org/docs/messages/module-not-found
    - img
  - button "Attach Node.js inspector":
    - img
  - text: "Module not found: Can't resolve 'fs'"
  - img
  - text: ./OneDrive/Documents/Ranga Estate PWCW Project/src/lib/db-storage.ts (1:1)
  - button "Open in editor":
    - img
  - text: "Module not found: Can't resolve 'fs' > 1 | import fs from \"fs\"; | ^^^^^^^^^^^^^^^^^^^^ 2 | import path from \"path\"; 3 | 4 | // Master Data Types Import traces: Client Component Browser: ./OneDrive/Documents/Ranga Estate PWCW Project/src/lib/db-storage.ts [Client Component Browser] ./OneDrive/Documents/Ranga Estate PWCW Project/src/lib/transaction-logs.ts [Client Component Browser] ./OneDrive/Documents/Ranga Estate PWCW Project/src/app/machinery/page.tsx [Client Component Browser] ./OneDrive/Documents/Ranga Estate PWCW Project/src/app/machinery/page.tsx [Server Component] Client Component SSR: ./OneDrive/Documents/Ranga Estate PWCW Project/src/lib/db-storage.ts [Client Component SSR] ./OneDrive/Documents/Ranga Estate PWCW Project/src/lib/transaction-logs.ts [Client Component SSR] ./OneDrive/Documents/Ranga Estate PWCW Project/src/app/machinery/page.tsx [Client Component SSR] ./OneDrive/Documents/Ranga Estate PWCW Project/src/app/machinery/page.tsx [Server Component]"
  - link "https://nextjs.org/docs/messages/module-not-found":
    - /url: https://nextjs.org/docs/messages/module-not-found
- button "Open issues overlay":
  - img
  - text: 1 Issue
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Epic: Transaction Logging Forms", () => {
  4  |   test.beforeEach(async ({ context }) => {
  5  |     await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
  6  |   });
  7  | 
  8  |   test("1. Submit Fertilizer Log entry and verify in history", async ({ page }) => {
  9  | 
  10 |     await page.goto("http://localhost:3000/fertilizer");
  11 |     await expect(page.locator("main h1")).toContainText("Fertilizer Logs");
  12 | 
  13 |     await page.fill("#fert-name-input", "Urea 46% N");
  14 |     await page.fill("#fert-qty-input", "100");
  15 |     await page.fill("#fert-cost-input", "4200");
  16 |     await page.click("#form-submit-btn");
  17 | 
  18 |     await expect(page.locator("table")).toContainText("Urea 46% N");
  19 |     await expect(page.locator("table")).toContainText("100 kg");
  20 |   });
  21 | 
  22 |   test("2. Submit Diesel Log entry and verify in history", async ({ page }) => {
  23 |     await page.goto("http://localhost:3000/diesel");
  24 |     await expect(page.locator("main h1")).toContainText("Diesel Fuel Logs");
  25 | 
  26 |     await page.fill("#diesel-qty-input", "150");
  27 |     await page.fill("#diesel-cost-input", "14250");
  28 |     await page.click("#form-submit-btn");
  29 | 
  30 |     await expect(page.locator("table")).toContainText("150 L");
  31 |     await expect(page.locator("table")).toContainText("₹14250");
  32 |   });
  33 | 
  34 |   test("3. Submit Machinery Log with auto-calculated runtime & diesel", async ({ page }) => {
  35 |     await page.goto("http://localhost:3000/machinery");
  36 |     await expect(page.locator("main h1")).toContainText("Machinery Usage");
  37 | 
  38 |     await page.selectOption("#machine-select", "John Deere Tractor");
  39 |     await page.fill("#start-time-input", "08:00");
  40 |     await page.fill("#end-time-input", "12:00");
  41 |     await page.click("#form-submit-btn");
  42 | 
  43 |     await expect(page.locator("table")).toContainText("John Deere Tractor");
  44 |     await expect(page.locator("table")).toContainText("4 hrs");
  45 |   });
  46 | 
  47 |   test("4. Submit Labor Log with auto-calculated total wages", async ({ page }) => {
  48 |     await page.goto("http://localhost:3000/labor");
  49 |     await expect(page.locator("main h1")).toContainText("Labor Usage");
  50 | 
  51 |     await page.fill("#men-count-input", "5");
  52 |     await page.fill("#men-wage-input", "600");
  53 |     await page.fill("#women-count-input", "5");
  54 |     await page.fill("#women-wage-input", "400");
  55 |     await page.click("#form-submit-btn");
  56 | 
  57 |     await expect(page.locator("table")).toContainText("5 Men");
  58 |     await expect(page.locator("table")).toContainText("5 Women");
  59 |     await expect(page.locator("table")).toContainText("₹5000");
  60 |   });
  61 | 
  62 |   test("5. Submit Production Log entry and verify in history", async ({ page }) => {
  63 |     await page.goto("http://localhost:3000/production");
  64 |     await expect(page.locator("main h1")).toContainText("Crop Production");
  65 | 
  66 |     await page.fill("#prod-qty-input", "850");
  67 |     await page.click("#form-submit-btn");
  68 | 
  69 |     await expect(page.locator("table")).toContainText("850 kg");
  70 |   });
  71 | 
  72 |   test("6. Submit Sales Log entry and verify in history", async ({ page }) => {
  73 |     await page.goto("http://localhost:3000/sales");
> 74 |     await expect(page.locator("main h1")).toContainText("Crop Sales");
     |                                           ^ Error: expect(locator).toContainText(expected) failed
  75 | 
  76 |     await page.fill("#sales-qty-input", "750");
  77 |     await page.fill("#sales-val-input", "33750");
  78 |     await page.fill("#sales-buyer-input", "Global Agritech Mandi");
  79 |     await page.click("#form-submit-btn");
  80 | 
  81 |     await expect(page.locator("table")).toContainText("Global Agritech Mandi");
  82 |     await expect(page.locator("table")).toContainText("₹33750");
  83 |   });
  84 | });
  85 | 
  86 | 
```