# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: settings-reset.spec.ts >> Epic: Settings & Reset Operations >> navigate to settings page and trigger a full database reset
- Location: e2e\settings-reset.spec.ts:8:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('main h1')
Expected substring: "System Settings"
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
  3  | test.describe("Epic: Settings & Reset Operations", () => {
  4  |   test.beforeEach(async ({ context }) => {
  5  |     await context.addCookies([{ name: "estate_authenticated", value: "true", domain: "localhost", path: "/" }]);
  6  |   });
  7  | 
  8  |   test("navigate to settings page and trigger a full database reset", async ({ page }) => {
  9  |     await page.goto("http://localhost:3000/settings");
  10 | 
  11 |     // 1. Verify page elements
> 12 |     await expect(page.locator("main h1")).toContainText("System Settings");
     |                                           ^ Error: expect(locator).toContainText(expected) failed
  13 |     await expect(page.getByRole("button", { name: "Reset All Data" })).toBeVisible();
  14 | 
  15 |     // 2. Click Reset button to trigger modal
  16 |     await page.getByRole("button", { name: "Reset All Data" }).click();
  17 | 
  18 |     // 3. Verify modal is visible
  19 |     await expect(page.locator("body")).toContainText("Permanently Delete All Data?");
  20 |     
  21 |     // 4. Confirm deletion
  22 |     await page.getByRole("button", { name: "Yes, Reset All Data" }).click();
  23 | 
  24 |     // 5. Verify success alert/redirection
  25 |     await expect(page.locator("body")).toContainText("Data Successfully Reset");
  26 |     
  27 |     // 6. Wait for redirect to dashboard
  28 |     await page.waitForURL("http://localhost:3000/", { timeout: 5000 });
  29 |     await expect(page.locator("main h1")).toContainText("Executive Dashboard");
  30 |   });
  31 | });
  32 | 
```