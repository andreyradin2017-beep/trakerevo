import { test, expect } from "@playwright/test";

test.describe("Functional Flow: Add and Navigate", () => {
  test.beforeEach(async ({ page }) => {
    // Disable animations and mock auth
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
      window.localStorage.setItem("framer-motion-reduced-motion", "always");

      const session = {
        access_token: "fake",
        user: { id: "test-user-id", email: "test@example.com" },
      };
      window.localStorage.setItem(
        "sb-pdqfuivaiclyrqbcvrrs-auth-token",
        JSON.stringify(session),
      );
      console.log("Mock session and styles injected");
    });

    // Mock TMDB
    await page.route("**/api.themoviedb.org/3/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: 515696,
              title: "Test Movie",
              poster_path: "/test.jpg",
              media_type: "movie",
              release_date: "2024-01-01",
              genre_ids: [28],
            },
          ],
        }),
      });
    });

    // Mock RAWG
    await page.route("**/api.rawg.io/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: 12345,
              name: "Test Game",
              background_image: "/test_game.jpg",
              released: "2024-02-02",
              genres: [{ name: "Action" }],
            },
          ],
        }),
      });
    });

    // Mock Google Books
    await page.route("**/www.googleapis.com/books/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "book123",
              volumeInfo: {
                title: "Test Book",
                authors: ["Test Author"],
                imageLinks: { thumbnail: "/test_book.jpg" },
              },
            },
          ],
        }),
      });
    });

    await page.goto("/discover");
    console.log("Navigated to /discover");
  });

  test("Should add item from Discover and navigate to details", async ({
    page,
  }) => {
    console.log(
      "Starting: Should add item from Discover and navigate to details",
    );

    // 1. Wait for ANY button to appear first to see if load finished
    try {
      await page.waitForSelector('button, div[role="button"]', {
        state: "visible",
        timeout: 10000,
      });
      console.log("Some buttons/interactive elements found in DOM");
    } catch (e) {
      console.log("No interactive elements found after 10s. Dumping HTML...");
      const html = await page.content();
      console.log(html.slice(0, 1000)); // Log first 1000 chars of HTML
      await page.screenshot({ path: "test-failure-no-buttons.png" });
      throw e;
    }

    const cardSelector = 'div[role="button"][aria-label*="Открыть детали"]';
    console.log("Waiting for specific card selector:", cardSelector);

    try {
      await page.waitForSelector(cardSelector, {
        state: "visible",
        timeout: 10000,
      });
    } catch (e) {
      console.log("Specific card not found. Listing all aria-labels in DOM:");
      const labels = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("[aria-label]")).map((el) =>
          el.getAttribute("aria-label"),
        );
      });
      console.log("Labels found:", labels);
      await page.screenshot({ path: "test-failure-no-card.png" });
      throw e;
    }

    const card = page.locator(cardSelector).first();
    await expect(card).toBeVisible();

    const title = await card.getAttribute("aria-label");
    console.log("Found card with label:", title);

    // 2. Click the card
    await card.click();
    console.log("Clicked card, waiting for navigation...");

    // 3. Check URL change (using regular expression to match internal ID)
    await page.waitForURL(/\/item\/.+/, { timeout: 15000 });
    const url = page.url();
    console.log("Current URL:", url);
    expect(url).toContain("/item/");

    // 4. Check if Details page shows title
    const heading = page.locator("h1");
    // TMDB mock returns "Test Movie", RAWG returns "Test Game". Either should work depending on which loads first.
    await expect(heading).toBeVisible({ timeout: 10000 });
    const headingText = await heading.textContent();
    console.log("Heading text found:", headingText);
    expect(headingText).toMatch(/Test (Movie|Game)/);
  });

  test("Should show 'In Collection' badge after adding", async ({ page }) => {
    console.log("Starting: Should show 'In Collection' badge after adding");

    const cardSelector = 'div[role="button"][aria-label*="Открыть детали"]';
    await page.waitForSelector(cardSelector, {
      state: "visible",
      timeout: 15000,
    });
    const card = page.locator(cardSelector).first();

    // 1. Quick Add
    const quickAddBtn = card.locator('button[aria-label="Быстрое добавление"]');
    if (await quickAddBtn.isVisible()) {
      console.log("Clicking Quick Add button");
      await quickAddBtn.click();
    } else {
      console.log(
        "Quick Add button not visible, clicking card to add via handleClick",
      );
      await card.click();
      await page.waitForURL(/\/item\/.+/);
      await page.goBack();
      await page.waitForSelector(cardSelector);
    }

    // 2. Refresh or wait for Dexie update (LiveQuery)
    // Dexie-react-hooks should update automatically.

    // 3. Check badge
    const badge = card.locator("text=В коллекции");
    console.log("Waiting for 'В коллекции' badge...");
    await expect(badge).toBeVisible({ timeout: 10000 });
    console.log("Badge found!");
  });
});
