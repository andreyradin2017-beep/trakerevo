import axios from "axios";
import { db } from "../db/db";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const RAWG_BASE_URL = "https://api.rawg.io/api";

interface DiscoverData {
  trending: Item[];
  upcoming: Item[];
  newGames: Item[];
  upcomingGames: Item[];
}

export const getDiscoverData = async (): Promise<DiscoverData> => {
  const cacheKey = "discover_data_v7";
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

    // Date calculations for RAWG
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const next6Months = new Date(today);
    next6Months.setMonth(today.getMonth() + 6);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const [trendingRes, upcomingRes, newGamesRes, upcomingGamesRes] =
      await Promise.all([
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

        // New Games (last 30 days)
        rawgKey
          ? axios.get(`${RAWG_BASE_URL}/games`, {
              params: {
                key: rawgKey,
                dates: `${formatDate(last30Days)},${formatDate(today)}`,
                ordering: "-added",
                page_size: 20,
              },
            })
          : Promise.resolve({ data: { results: [] } }),

        // Upcoming Games (next 6 months)
        rawgKey
          ? axios.get(`${RAWG_BASE_URL}/games`, {
              params: {
                key: rawgKey,
                dates: `${formatDate(tomorrow)},${formatDate(next6Months)}`,
                ordering: "-added",
                page_size: 20,
              },
            })
          : Promise.resolve({ data: { results: [] } }),
      ]);

    const mapTmdbItems = (items: any[]): Item[] =>
      items.slice(0, 20).map((item) => ({
        title: item.title || item.name,
        type: item.media_type === "tv" ? "show" : "movie",
        status: "planned",
        image: item.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w500${item.poster_path}`,
            )
          : undefined,
        year:
          item.release_date || item.first_air_date
            ? new Date(item.release_date || item.first_air_date).getFullYear()
            : undefined,
        releaseDate:
          item.release_date || item.first_air_date
            ? new Date(item.release_date || item.first_air_date)
            : undefined,
        externalId: item.id.toString(),
        source: "tmdb",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const mapRawgItems = (items: any[]): Item[] =>
      items.slice(0, 20).map((game) => ({
        title: game.name,
        type: "game",
        status: "planned",
        image: game.background_image
          ? getProxiedImageUrl(game.background_image)
          : undefined,
        year: game.released ? new Date(game.released).getFullYear() : undefined,
        releaseDate: game.released ? new Date(game.released) : undefined,
        externalId: game.id.toString(),
        source: "rawg",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const trending = mapTmdbItems(trendingRes.data.results);
    const upcoming = mapTmdbItems(upcomingRes.data.results);
    const newGames = mapRawgItems(newGamesRes.data.results);
    const upcomingGames = mapRawgItems(upcomingGamesRes.data.results);

    const data = { trending, upcoming, newGames, upcomingGames };

    await db.cache.put({
      key: cacheKey,
      data,
      timestamp: Date.now(),
    });

    return data;
  } catch (error) {
    console.error("Discover data fetch failed:", error);
    return { trending: [], upcoming: [], newGames: [], upcomingGames: [] };
  }
};
