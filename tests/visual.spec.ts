import { test, expect } from "@playwright/test";

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Мокаем TMDB (Поиск и Тренды)
    await page.route(
      "**/api.themoviedb.org/3/search/multi**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [
              {
                id: 1,
                media_type: "movie",
                title: "Visual Test Movie",
                overview: "Test overview",
                poster_path: null,
                release_date: "2024-01-01",
              },
            ],
          }),
        });
      },
    );

    await page.route(
      "**/api.themoviedb.org/3/trending/movie/day**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ results: [] }), // Скрываем тренды для стабильности
        });
      },
    );

    // 2. Мокаем RAWG
    await page.route("**/api.rawg.io/api/games**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [] }),
      });
    });

    await page.route("**/api.rawg.io/api/games/1**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          name: "Visual Test Game",
          description_raw: "Test",
          playtime: 40,
        }),
      });
    });

    // Очищаем базу
    await page.goto("/");
    await page.evaluate(async () => {
      const databases = await window.indexedDB.databases();
      for (const db of databases) {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      }
    });
    await page.waitForTimeout(500);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Design Check: Library -> Search -> Detail", async ({ page }) => {
    // 1. Библиотека
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot("library-empty.png", {
      maxDiffPixelRatio: 0.05,
      mask: [page.locator('[data-testid="sync-status"]')],
    });

    // 2. Поиск
    await page.goto("/search");
    const searchInput = page.locator('input[placeholder*="ищем"]');
    await searchInput.fill("Visual Test");
    await page.keyboard.press("Enter");

    await expect(page.getByText("Visual Test Movie")).toBeVisible({
      timeout: 10000,
    });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot("search-results.png", {
      maxDiffPixelRatio: 0.05,
    });

    // 3. Детали
    await page.locator('[aria-label*="Добавить в коллекцию"]').first().click();
    await page.goto("/");
    await page.getByText("Visual Test Movie").first().click();

    await expect(page.getByText("Visual Test Movie")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot("item-detail-page.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });
});
