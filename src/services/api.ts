import { db } from "../db/db";
import type { Item } from "../types";
import { searchMovies, getMovieDetails } from "./tmdb";
import { searchGames, getGameDetails } from "./rawg";
import { searchBooks, getBookDetails } from "./googleBooks";
import { searchKinopoisk, getKinopoiskDetails } from "./kinopoisk";

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getCachedData = async (key: string): Promise<any | null> => {
  const cached = await db.cache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    await db.cache.delete(key);
    return null;
  }

  return cached.data;
};

const setCachedData = async (key: string, data: any) => {
  await db.cache.put({
    key,
    data,
    timestamp: Date.now(),
  });
};

export const searchAll = async (query: string): Promise<Item[]> => {
  const cacheKey = `search_all_${query}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  try {
    // Get enabled providers
    const providers = await db.search_providers.toArray();
    const enabledProviders = new Set(
      providers.filter((p) => p.enabled).map((p) => p.id),
    );

    // Only search enabled providers
    const searches: Promise<Item[]>[] = [];

    if (enabledProviders.has("tmdb")) {
      searches.push(
        searchMovies(query).catch((e) => {
          console.warn("TMDB Search failed", e);
          return [];
        }),
      );
    }

    if (enabledProviders.has("rawg")) {
      searches.push(
        searchGames(query).catch((e) => {
          console.warn("RAWG Search failed", e);
          return [];
        }),
      );
    }

    if (enabledProviders.has("google_books")) {
      searches.push(
        searchBooks(query).catch((e) => {
          console.warn("Google Books Search failed", e);
          return [];
        }),
      );
    }

    if (enabledProviders.has("kinopoisk")) {
      searches.push(
        searchKinopoisk(query).catch((e) => {
          console.warn("Kinopoisk Search failed", e);
          return [];
        }),
      );
    }

    const results = await Promise.all(searches);
    const allResults = results.flat();
    await setCachedData(cacheKey, allResults);
    return allResults;
  } catch (error) {
    console.error("Search All Error:", error);
    return [];
  }
};

export const searchByCategory = async (
  query: string,
  category: "movie" | "game" | "book",
): Promise<Item[]> => {
  const cacheKey = `search_${category}_${query}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  let results: Item[] = [];
  try {
    switch (category) {
      case "movie":
        const [tmdbResults, kpResults] = await Promise.all([
          searchMovies(query).catch(() => []),
          searchKinopoisk(query).catch(() => []),
        ]);
        results = [...tmdbResults, ...kpResults];
        break;
      case "game":
        results = await searchGames(query).catch(() => []);
        break;
      case "book":
        results = await searchBooks(query).catch(() => []);
        break;
    }
    await setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Search ${category} Error:`, error);
    return [];
  }
};

export const getDetails = async (item: Item): Promise<any> => {
  const cacheKey = `details_${item.source}_${item.externalId}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 12000),
    );

    const fetchPromise = (async () => {
      if (item.source === "tmdb" && item.externalId) {
        return getMovieDetails(item.externalId, item.type as any);
      }
      if (item.source === "kinopoisk" && item.externalId) {
        return getKinopoiskDetails(item.externalId);
      }
      if (item.source === "rawg" && item.externalId) {
        return getGameDetails(item.externalId);
      }
      if (item.source === "google_books" && item.externalId) {
        return getBookDetails(item.externalId);
      }
      return null;
    })();

    const data = await Promise.race([fetchPromise, timeoutPromise]);
    if (data) {
      await setCachedData(cacheKey, data);
    }
    return data;
  } catch (error) {
    console.error("getDetails failed:", error);
    return null;
  }
};
