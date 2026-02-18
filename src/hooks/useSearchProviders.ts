import { useEffect } from "react";
import { db } from "../db/db";
import type { SearchProvider } from "../types";

const DEFAULT_PROVIDERS: SearchProvider[] = [
  { id: "tmdb", enabled: true, priority: 1 },
  { id: "rawg", enabled: true, priority: 2 },
  { id: "google_books", enabled: true, priority: 3 },
];

export const useSearchProviders = () => {
  useEffect(() => {
    const initProviders = async () => {
      try {
        const count = await db.search_providers.count();
        if (count !== DEFAULT_PROVIDERS.length) {
          // Reset providers if count mismatch (e.g. after removing kinopoisk)
          await db.search_providers.clear();
          await db.search_providers.bulkPut(DEFAULT_PROVIDERS);
        }
      } catch (error) {
        console.error("Failed to initialize search providers:", error);
      }
    };

    initProviders();
  }, []);
};
