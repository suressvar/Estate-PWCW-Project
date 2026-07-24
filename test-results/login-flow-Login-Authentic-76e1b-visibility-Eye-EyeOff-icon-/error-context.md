# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login-flow.spec.ts >> Login Authentication & Password Toggle Flow >> 2. Toggle password visibility (Eye / EyeOff icon)
- Location: e2e\login-flow.spec.ts:15:7

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('#login-password')
Expected: "text"
Received: "password"
Timeout:  5000ms

Call log:
  - Expect "toHaveAttribute" with timeout 5000ms
  - waiting for locator('#login-password')
    14 × locator resolved to <input value="" type="password" id="login-password" placeholder="••••••••" class="w-full pl-9 pr-10 py-2.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:bg-white/10 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all duration-200"/>
       - unexpected value "password"

```

```yaml
- textbox "••••••••": secret123
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Login Authentication & Password Toggle Flow", () => {
  4  |   test("1. Unauthenticated user is redirected to /login", async ({ page, context }) => {
  5  |     // Clear cookies explicitly
  6  |     await context.clearCookies();
  7  |     await page.goto("http://localhost:3000/login");
  8  | 
  9  |     // Verify Login page components
  10 |     await expect(page.locator("h1")).toContainText("Ranga Estate");
  11 |     await expect(page.locator("h2")).toContainText("Account Sign In");
  12 |   });
  13 | 
  14 | 
  15 |   test("2. Toggle password visibility (Eye / EyeOff icon)", async ({ page }) => {
  16 |     await page.goto("http://localhost:3000/login");
  17 | 
  18 |     const passwordInput = page.locator("#login-password");
  19 |     await passwordInput.fill("secret123");
  20 | 
  21 |     // Initially input type should be password
  22 |     await expect(passwordInput).toHaveAttribute("type", "password");
  23 | 
  24 |     // Click Eye button to reveal password
  25 |     await page.click("#toggle-password-visibility");
> 26 |     await expect(passwordInput).toHaveAttribute("type", "text");
     |                                 ^ Error: expect(locator).toHaveAttribute(expected) failed
  27 | 
  28 |     // Click again to hide password
  29 |     await page.click("#toggle-password-visibility");
  30 |     await expect(passwordInput).toHaveAttribute("type", "password");
  31 |   });
  32 | 
  33 |   test("3. Successful login redirects to main Executive Dashboard", async ({ page }) => {
  34 |     await page.goto("http://localhost:3000/login");
  35 | 
  36 |     await page.fill("#login-username", "Admin");
  37 |     await page.fill("#login-password", "Admin123");
  38 |     await page.click("#login-submit-btn");
  39 | 
  40 | 
  41 |     // Expect navigation to root Dashboard
  42 |     await page.waitForURL("http://localhost:3000/");
  43 |     await expect(page.locator("main h1")).toContainText("Executive Dashboard");
  44 |   });
  45 | });
  46 | 
```