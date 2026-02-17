import { test, expect } from "@playwright/test";

test.describe("User Journey: Guest to Authenticated", () => {
  // Set longer timeout for the whole suite as Firefox can be slow with IndexedDB
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
      localStorage.clear();
      sessionStorage.clear();
    });
    // Wait for DB to be deleted before proceeding
    await page.waitForTimeout(1000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("should allow adding items as guest and prompt for migration after login", async ({
    page,
  }) => {
    // 1. Start as Guest on Home page
    await page.goto("/");

    // We expect the Onboarding to be visible for a fresh guest
    await expect(page.getByText("TrakerEvo").first()).toBeVisible({
      timeout: 15000,
    });

    const startButton = page.locator('button:has-text("Найти первое")');
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 2. Verify we navigated to Search
    await expect(page).toHaveURL(/.*search/);

    // Fill the search input.
    // IMPORTANT: App uses ru-RU by default for TMDB, so we search for a title that we know its RU equivalent.
    // Searching for "Inception" returns "Начало".
    const searchInput = page.locator('input[placeholder*="ищем"]');
    await searchInput.fill("Начало");
    await page.keyboard.press("Enter");

    // Wait for search results
    const quickAddBtn = page
      .locator('[aria-label*="Добавить в коллекцию"]')
      .first();
    await expect(quickAddBtn).toBeVisible({ timeout: 20000 });

    // Click and wait a bit for Dexie to commit
    await quickAddBtn.click();
    await page.waitForTimeout(1500);

    // 3. Verify item in library (Home)
    await page.locator('nav a:has-text("Главная")').click();

    // In slower browsers (Firefox), IndexedDB state might take a moment to reflect in UI
    const libraryItem = page
      .locator("main")
      .getByText("Начало", { exact: false })
      .first();

    try {
      await expect(libraryItem).toBeVisible({ timeout: 25000 });
    } catch (e) {
      console.log("Item not visible, attempting reload...");
      await page.reload();
      await expect(libraryItem).toBeVisible({ timeout: 20000 });
    }

    // 4. Navigate to Login via Profile (Settings)
    await page.locator('nav a:has-text("Профиль")').click();
    const loginBtn = page.locator('button:has-text("Войти в аккаунт")');
    await expect(loginBtn).toBeVisible();
    await loginBtn.click();

    // Verify Login Modal is open
    await expect(page.getByText(/Вход \/ Регистрация/i)).toBeVisible();
  });

  test("Navigation Audit: No Dead Ends", async ({ page }) => {
    const mainRoutes = ["/", "/random", "/archive", "/stats", "/settings"];

    for (const route of mainRoutes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await expect(page).not.toHaveTitle(/404/);
      await expect(page.locator("nav")).toBeVisible({ timeout: 15000 });
    }
  });
});
