import { db } from "../db/db";
import type { Item } from "../types";
import { searchMovies, getMovieDetails, getTrendingMovies } from "./tmdb";
import { searchGames, getGameDetails, getPopularGames } from "./rawg";
import { searchBooks, getBookDetails } from "./googleBooks";

const CACHE_TTL = 24 * 60 * 60 * 1000;

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
  await db.cache.put({ key, data, timestamp: Date.now() });
};

export const searchAll = async (query: string): Promise<Item[]> => {
  const cacheKey = `search_all_${query}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  const providersArr = await db.search_providers.toArray();
  const enabledProviders = providersArr.filter((p) => p.enabled);

  if (enabledProviders.length === 0) return [];

  const searchTasks: { id: string; promise: Promise<any> }[] = [];
  if (enabledProviders.some((p) => p.id === "tmdb"))
    searchTasks.push({ id: "tmdb", promise: searchMovies(query) });
  if (enabledProviders.some((p) => p.id === "rawg"))
    searchTasks.push({ id: "rawg", promise: searchGames(query) });
  if (enabledProviders.some((p) => p.id === "google_books"))
    searchTasks.push({ id: "google_books", promise: searchBooks(query) });

  const settledTasks = await Promise.allSettled(
    searchTasks.map(async (task) => {
      const res = await task.promise;
      return { id: task.id, results: res || [] };
    }),
  );

  const finalResults: Item[] = [];
  settledTasks.forEach((res) => {
    if (res.status === "fulfilled") {
      finalResults.push(...res.value.results);
    }
  });

  if (finalResults.length > 0) {
    await setCachedData(cacheKey, finalResults);
  }

  return finalResults;
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
    if (category === "movie") {
      results = (await searchMovies(query)) || [];
    } else if (category === "game") {
      results = (await searchGames(query)) || [];
    } else if (category === "book") {
      results = (await searchBooks(query)) || [];
    }
  } catch (e) {
    console.error(`Search category ${category} failed:`, e);
  }

  if (results.length > 0) {
    await setCachedData(cacheKey, results);
  }
  return results;
};

export const getDetails = async (item: Item): Promise<any> => {
  const cacheKey = `details_${item.source}_${item.externalId}`;
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  let data = null;
  try {
    if (item.source === "tmdb")
      data = await getMovieDetails(item.externalId!, item.type as any);
    else if (item.source === "rawg")
      data = await getGameDetails(item.externalId!);
    else if (item.source === "google_books")
      data = await getBookDetails(item.externalId!);
  } catch (e) {
    console.error(`Get details failed for ${item.source}:`, e);
  }

  if (data) await setCachedData(cacheKey, data);
  return data;
};

export const getTrending = async (
  category: "movie" | "game" | "all",
): Promise<string[]> => {
  try {
    if (category === "movie") return await getTrendingMovies();
    if (category === "game") return await getPopularGames();

    const [m, g] = await Promise.allSettled([
      getTrendingMovies(),
      getPopularGames(),
    ]);
    const movies = m.status === "fulfilled" ? m.value : [];
    const games = g.status === "fulfilled" ? g.value : [];

    const combined = [];
    for (let i = 0; i < Math.max(movies.length, games.length); i++) {
      if (movies[i]) combined.push(movies[i]);
      if (games[i]) combined.push(games[i]);
    }
    return combined.slice(0, 8);
  } catch (e) {
    console.error("Get trending failed:", e);
    return [];
  }
};
