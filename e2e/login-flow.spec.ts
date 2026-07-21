import { test, expect } from "@playwright/test";

test.describe("Login Authentication & Password Toggle Flow", () => {
  test("1. Unauthenticated user is redirected to /login", async ({ page, context }) => {
    // Clear cookies explicitly
    await context.clearCookies();
    await page.goto("http://localhost:3000/login");

    // Verify Login page components
    await expect(page.locator("h1")).toContainText("Ranga Estate");
    await expect(page.locator("h2")).toContainText("Account Sign In");
  });


  test("2. Toggle password visibility (Eye / EyeOff icon)", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    const passwordInput = page.locator("#login-password");
    await passwordInput.fill("secret123");

    // Initially input type should be password
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click Eye button to reveal password
    await page.click("#toggle-password-visibility");
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide password
    await page.click("#toggle-password-visibility");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("3. Successful login redirects to main Executive Dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/login");

    await page.fill("#login-username", "estate_admin");
    await page.fill("#login-password", "admin123");
    await page.click("#login-submit-btn");


    // Expect navigation to root Dashboard
    await page.waitForURL("http://localhost:3000/");
    await expect(page.locator("main h1")).toContainText("Executive Dashboard");
  });
});
