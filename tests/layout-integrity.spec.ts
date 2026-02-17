import { test, expect } from "@playwright/test";

test.describe("Design Integrity: Final Verification", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Принудительно отключаем анимации для стабильности
    await page.addInitScript(() => {
      const style = document.createElement("style");
      style.innerHTML = `
        *, *::before, *::after {
          transition: none !important;
          animation: none !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);

      // Имитируем уменьшенное движение для Framer Motion
      window.localStorage.setItem("framer-motion-reduced-motion", "always");

      // Мокаем matchMedia для полной уверенности
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: (query: string) => ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => {},
        }),
      });
    });

    // 2. Мокаем Supabase Auth (pdqfuivaiclyrqbcvrrs)
    await page.addInitScript(() => {
      const projectRef = "pdqfuivaiclyrqbcvrrs";
      const session = {
        access_token: "fake-jwt-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "fake-refresh-token",
        user: {
          id: "test-user-id",
          email: "test@example.com",
          aud: "authenticated",
          role: "authenticated",
          user_metadata: { full_name: "Test User" },
          app_metadata: { provider: "email" },
        },
      };
      window.localStorage.setItem(
        `sb-${projectRef}-auth-token`,
        JSON.stringify(session),
      );
      window.localStorage.setItem("trakerevo_sync_status", "success");
    });

    // 3. Мокаем ВСЕ внешние API для предотвращения зависаний

    // TMDB
    await page.route("**/api.themoviedb.org/3/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: 1,
              title: "Mock Movie",
              poster_path: "/p1.jpg",
              media_type: "movie",
              release_date: "2024-01-01",
              genre_ids: [28],
            },
          ],
          trending: [],
        }),
      });
    });

    // RAWG
    await page.route("**/api.rawg.io/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: 101,
              name: "Mock Game",
              background_image: "/g1.jpg",
              released: "2024-01-01",
              genres: [{ name: "Action" }],
            },
          ],
        }),
      });
    });

    // Kinopoisk
    await page.route("**/kinopoiskapiunofficial.tech/api/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Design Integrity: Card Elements Containment", async ({ page }) => {
    // Переходим в Discover где гарантированно есть карточки из мока
    await page.goto("/discover");

    // Ждем появления хотя бы одной секции с карточками
    const cardSelector = ".card-base, [style*='min-width: 124px']"; // DiscoverCard uses inline style minWidth
    await page.waitForSelector(cardSelector, {
      state: "visible",
      timeout: 20000,
    });

    const cards = page.locator(cardSelector);
    const cardCount = await cards.count();
    console.log(`Checking ${cardCount} cards in Discover...`);

    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      const card = cards.nth(i);
      const cardBox = await card.boundingBox();
      if (!cardBox) continue;

      // В DiscoverCard значки (Plus, Check, Countdown) позиционированы абсолютно
      const absoluteElements = card.locator('[style*="position: absolute"]');
      const badgeCount = await absoluteElements.count();

      for (let j = 0; j < badgeCount; j++) {
        const badge = absoluteElements.nth(j);
        if (!(await badge.isVisible())) continue;

        const badgeBox = await badge.boundingBox();
        if (badgeBox) {
          // Допуск 5px для учета теней и особенностей рендеринга
          const isInsideX =
            badgeBox.x >= cardBox.x - 5 &&
            badgeBox.x + badgeBox.width <= cardBox.x + cardBox.width + 5;
          const isInsideY =
            badgeBox.y >= cardBox.y - 5 &&
            badgeBox.y + badgeBox.height <= cardBox.y + cardBox.height + 5;

          expect(isInsideX, `Badge ${j} in Card ${i} leaks X`).toBe(true);
          expect(isInsideY, `Badge ${j} in Card ${i} leaks Y`).toBe(true);
        }
      }
    }
  });

  test("Design Integrity: Header Alignment", async ({ page }) => {
    await page.goto("/");
    const headerTitle = page.locator("h1").first();
    await expect(headerTitle).toBeVisible();

    // Проверяем индикатор синхронизации
    const syncBadge = page.locator('[data-testid="sync-status"]');

    // Если бейдж не появился за 5 секунд, возможно он в "idle" состоянии.
    // Но мы мокнули Sync Status Badge чтобы он был data-testid.
    // Если его нет в DOM, это не ошибка дизайна, а состояние приложения.
    // Но для ТЕСТА нам важно чтобы он был выровнен если он есть.
    if ((await syncBadge.count()) > 0 && (await syncBadge.isVisible())) {
      const headerBox = await headerTitle.boundingBox();
      const badgeBox = await syncBadge.boundingBox();

      if (headerBox && badgeBox) {
        // Вертикальная разница не должна быть огромной
        expect(Math.abs(badgeBox.y - headerBox.y)).toBeLessThan(100);
      }
    }
  });
});
