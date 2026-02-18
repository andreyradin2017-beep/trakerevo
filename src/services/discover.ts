import { db } from "../db/db";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";
import { tmdbClient, rawgClient } from "./apiClient";

interface DiscoverData {
  trending: Item[];
  upcoming: Item[];
  newGames: Item[];
  upcomingGames: Item[];
}

const GENRE_MAP: Record<number, string> = {
  28: "Экшен",
  12: "Приключения",
  16: "Мультфильм",
  35: "Комедия",
  80: "Криминал",
  99: "Документальный",
  18: "Драма",
  10751: "Семейный",
  14: "Фэнтези",
  36: "История",
  27: "Ужасы",
  10402: "Музыка",
  9648: "Детектив",
  10749: "Мелодрама",
  878: "Фантастика",
  53: "Триллер",
  10752: "Военный",
  37: "Вестерн",
  10759: "Экшен и Приключения",
  10765: "Sci-Fi и Фэнтези",
};

const RAWG_GENRE_MAP: Record<string, string> = {
  Action: "Экшен",
  Adventure: "Приключения",
  RPG: "RPG",
  Shooter: "Экшен",
  Puzzle: "Пазл",
  Racing: "Гонки",
  Sports: "Спорт",
  Strategy: "Стратегия",
  Simulation: "Симулятор",
  Fighting: "Файтинг",
  Family: "Семейный",
  "Board Games": "Настольные",
};

export const getDiscoverData = async (): Promise<DiscoverData> => {
  const cacheKey = "discover_data_v12";
  const cached = await db.cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 6 * 60 * 60 * 1000) {
    return cached.data;
  }

  try {
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const next6Months = new Date(today);
    next6Months.setMonth(today.getMonth() + 6);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    const results = await Promise.allSettled([
      tmdbClient.get<any>("/trending/all/week", {
        params: { language: "ru-RU" },
      }),
      tmdbClient.get<any>("/movie/upcoming", {
        params: { language: "ru-RU", region: "RU" },
      }),
      rawgClient.get<any>("/games", {
        params: {
          dates: `${formatDate(last30Days)},${formatDate(today)}`,
          ordering: "-added",
          page_size: 10,
        },
      }),
      rawgClient.get<any>("/games", {
        params: {
          dates: `${formatDate(tomorrow)},${formatDate(next6Months)}`,
          ordering: "-added",
          page_size: 10,
        },
      }),
    ]);

    const trendingData =
      results[0].status === "fulfilled" ? results[0].value.data?.results : [];
    const upcomingData =
      results[1].status === "fulfilled" ? results[1].value.data?.results : [];
    const newGamesData =
      results[2].status === "fulfilled" ? results[2].value.data?.results : [];
    const upcomingGamesData =
      results[3].status === "fulfilled" ? results[3].value.data?.results : [];

    const mapTmdbItems = (items: any[] = []): Item[] =>
      items.slice(0, 10).map((item) => ({
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
        externalId: item.id.toString(),
        source: "tmdb" as const,
        tags:
          item.genre_ids?.map((id: number) => GENRE_MAP[id]).filter(Boolean) ||
          [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const mapRawgItems = (items: any[] = []): Item[] =>
      items.slice(0, 10).map((game) => ({
        title: game.name,
        type: "game",
        status: "planned",
        image: game.background_image
          ? getProxiedImageUrl(game.background_image)
          : undefined,
        year: game.released ? new Date(game.released).getFullYear() : undefined,
        externalId: game.id.toString(),
        source: "rawg" as const,
        tags:
          game.genres
            ?.map((g: any) => RAWG_GENRE_MAP[g.name] || g.name)
            .filter(Boolean) || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

    const data: DiscoverData = {
      trending: mapTmdbItems(trendingData),
      upcoming: mapTmdbItems(upcomingData),
      newGames: mapRawgItems(newGamesData),
      upcomingGames: mapRawgItems(upcomingGamesData),
    };

    await db.cache.put({ key: cacheKey, data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error("Discover data fetch failed:", error);
    return { trending: [], upcoming: [], newGames: [], upcomingGames: [] };
  }
};
