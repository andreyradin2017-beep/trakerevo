import { useEffect } from "react";
import { db } from "../db/db";
import type { SearchProvider } from "../types";

const DEFAULT_PROVIDERS: SearchProvider[] = [
  { id: "kinopoisk", enabled: true, priority: 1 },
  { id: "tmdb", enabled: true, priority: 2 },
  { id: "rawg", enabled: true, priority: 3 },
  { id: "google_books", enabled: true, priority: 4 },
];

export const useSearchProviders = () => {
  useEffect(() => {
    const initProviders = async () => {
      try {
        const count = await db.search_providers.count();
        if (count === 0) {
          await db.search_providers.bulkAdd(DEFAULT_PROVIDERS);
        }
      } catch (error) {
        console.error("Failed to initialize search providers:", error);
      }
    };

    initProviders();
  }, []);
};
