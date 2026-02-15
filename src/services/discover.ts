import axios from "axios";
import { db } from "../db/db";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const RAWG_BASE_URL = "https://api.rawg.io/api";

interface DiscoverData {
  trending: Item[];
  upcoming: Item[];
  topGames: Item[];
}

export const getDiscoverData = async (): Promise<DiscoverData> => {
  const cacheKey = "discover_data_v4";
  const cached = await db.cache.get(cacheKey);

  // Cache for 6 hours
  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    return cached.data;
  }

  try {
    const tmdbKey =
      (await db.settings.get("tmdb_key"))?.value ||
      import.meta.env.VITE_TMDB_API_KEY;
    const rawgKey =
      (await db.settings.get("rawg_key"))?.value ||
      import.meta.env.VITE_RAWG_API_KEY;

    const [trendingRes, upcomingRes, gamesRes] = await Promise.all([
      // Trending movies/shows
      tmdbKey
        ? axios.get(`${TMDB_BASE_URL}/trending/all/week`, {
            params: { api_key: tmdbKey, language: "ru-RU" },
          })
        : Promise.resolve({ data: { results: [] } }),

      // Upcoming movies
      tmdbKey
        ? axios.get(`${TMDB_BASE_URL}/movie/upcoming`, {
            params: { api_key: tmdbKey, language: "ru-RU", region: "RU" },
          })
        : Promise.resolve({ data: { results: [] } }),

      // Top rated games
      rawgKey
        ? axios.get(`${RAWG_BASE_URL}/games`, {
            params: {
              key: rawgKey,
              ordering: "-rating",
              page_size: 20,
            },
          })
        : Promise.resolve({ data: { results: [] } }),
    ]);

    const trending: Item[] = trendingRes.data.results
      .slice(0, 20)
      .map((item: any) => ({
        title: item.title || item.name,
        type: item.media_type === "tv" ? "show" : "movie",
        status: "planned",
        image: item.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            )
          : undefined,
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : undefined,
        releaseDate:
          item.release_date || item.first_air_date
            ? new Date(item.release_date || item.first_air_date)
            : undefined,
        externalId: item.id.toString(),
        source: "tmdb" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const upcoming: Item[] = upcomingRes.data.results
      .slice(0, 20)
      .map((item: any) => ({
        title: item.title,
        type: "movie" as const,
        status: "planned" as const,
        image: item.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            )
          : undefined,
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : undefined,
        releaseDate: item.release_date
          ? new Date(item.release_date)
          : undefined,
        externalId: item.id.toString(),
        source: "tmdb" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const topGames: Item[] = gamesRes.data.results
      .slice(0, 20)
      .map((game: any) => ({
        title: game.name,
        type: "game" as const,
        status: "planned" as const,
        image: game.background_image
          ? getProxiedImageUrl(game.background_image)
          : undefined,
        year: game.released ? new Date(game.released).getFullYear() : undefined,
        releaseDate: game.released ? new Date(game.released) : undefined,
        externalId: game.id.toString(),
        source: "rawg" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const data = { trending, upcoming, topGames };

    await db.cache.put({
      key: cacheKey,
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    console.error("Discover data fetch failed:", error);
    return { trending: [], upcoming: [], topGames: [] };
  }
};
