import { test, expect } from "@playwright/test";

test.describe("TrakerEvo Basic Flow", () => {
  test("should load home page", async ({ page }) => {
    await page.goto("/");

    // Check that the page title is visible
    await expect(page.locator("h1")).toContainText("TrakerEvo");
  });

  test("should navigate to search", async ({ page }) => {
    await page.goto("/");

    // Click on search navigation
    await page.click('[aria-label*="Поиск"], [href="/search"]');

    // Verify we're on the search page
    await expect(page).toHaveURL(/.*search/);
  });

  test("should open item detail", async ({ page }) => {
    await page.goto("/");

    // Wait for items to load
    await page.waitForSelector('[role="button"]', { timeout: 5000 });

    // Click on the first item card (not the add button)
    const cards = page.locator('[role="button"]');
    const firstItemCard = cards.nth(1); // Skip the "Add" card

    if (await firstItemCard.isVisible()) {
      await firstItemCard.click();

      // Verify detail page loaded
      await expect(page.locator("h2")).toBeVisible();
    }
  });

  test("should handle empty state", async ({ page }) => {
    await page.goto("/");

    // If there are no items, should show empty state or add button
    const addButton = page.locator("text=Добавить");
    await expect(addButton.first()).toBeVisible();
  });
});

test.describe("TrakerEvo Search", () => {
  test("should display search interface", async ({ page }) => {
    await page.goto("/search");

    // Verify search input is visible
    await expect(page.locator('input[type="text"]')).toBeVisible();

    // Verify category buttons are visible
    await expect(page.locator("text=Кино")).toBeVisible();
    await expect(page.locator("text=Игры")).toBeVisible();
    await expect(page.locator("text=Книги")).toBeVisible();

    // Select movie category
    await page.click("text=Кино");

    // Type in search
    await page.fill('input[type="text"]', "Test");

    // Verify input has value
    await expect(page.locator('input[type="text"]')).toHaveValue("Test");
  });
});
