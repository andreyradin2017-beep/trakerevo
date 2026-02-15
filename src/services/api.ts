import { db } from "../db/db";
import type { Item } from "../types";
import { searchMovies, getMovieDetails } from "./tmdb";
import { searchGames } from "./rawg";
import { searchBooks } from "./googleBooks";
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
    const [movies, games, books, kinopoiskResults] = await Promise.all([
      searchMovies(query).catch((e) => {
        console.warn("TMDB Search failed", e);
        return [];
      }),
      searchGames(query).catch((e) => {
        console.warn("RAWG Search failed", e);
        return [];
      }),
      searchBooks(query).catch((e) => {
        console.warn("Google Books Search failed", e);
        return [];
      }),
      searchYandexBooks(query).catch((e) => {
        console.warn("Yandex Books Search failed", e);
        return [];
      }),
      searchKinopoisk(query).catch((e) => {
        console.warn("Kinopoisk Search failed", e);
        return [];
      }),
    ]);

    const results = [...movies, ...games, ...books, ...kinopoiskResults];
    await setCachedData(cacheKey, results);
    return results;
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
      case "book": {
        const [googleBooks, yandexBooks] = await Promise.all([
          searchBooks(query).catch(() => []),
          searchYandexBooks(query).catch(() => []),
        ]);
        results = [...yandexBooks, ...googleBooks]; // Yandex first as requested
        break;
      }
    }
    await setCachedData(cacheKey, results);
    return results;
  } catch (error) {
    console.error(`Search ${category} Error:`, error);
    return [];
  }
};

export const getDetails = async (item: Item): Promise<any> => {
  try {
    // Add a timeout race to prevent infinite loading
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
      return null;
    })();

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    console.error("getDetails failed:", error);
    return null; // Return null so the UI can just show basic info
  }
};

// --- Yandex Books (Bookmate) API ---

export const searchYandexBooks = async (query: string): Promise<Item[]> => {
  try {
    const encodedQuery = encodeURIComponent(query);
    // Call our serverless proxy
    const response = await fetch(
      `/api/bookmate?path=/search/books%3Fq=${encodedQuery}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Yandex Books proxy");
    }

    const data = await response.json();

    // Yandex Books (Bookmate) usually returns a list or an object with 'books' key
    const books = data.books || [];

    return books.map((book: any) => ({
      title: book.title,
      type: "book",
      status: "planned",
      // Construct cover URL if uuid exists. Bookmate covers usually:
      // https://assets.bookmate.ru/assets/books/{uuid}/{width}.jpg
      image: book.uuid
        ? `https://assets.bookmate.ru/assets/books/${book.uuid}/400.jpg`
        : undefined,
      description: book.annotation || "",
      year: book.publication_date, // sometimes unix timestamp or year string
      // Bookmate ratings are often out of 10 or 5, adapt as needed
      rating: book.rating ? book.rating * 2 : 0, // assuming 5-star max
      tags: book.genres ? book.genres.map((g: any) => g.title) : [],
      source: "yandex",
      externalId: book.uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error("Error searching Yandex Books:", error);
    return [];
  }
};
