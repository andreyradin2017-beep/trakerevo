import type { Item } from "../types";
import type { KinopoiskMovieResult } from "../types/api";
import { logger } from "../utils/logger";
import { kinopoiskClient } from "./apiClient";

const CONTEXT = "KinopoiskService";

export const searchKinopoisk = async (query: string): Promise<Item[]> => {
  try {
    const data = await kinopoiskClient.get<any>("/movie/search", {
      settingsKey: "kinopoisk_key",
      envKey: "VITE_KINOPOISK_API_KEY",
      params: { query, limit: 20 },
    });

    if (!data?.docs) {
      return [];
    }

    return (data.docs as KinopoiskMovieResult[]).map((result) => ({
      title:
        result.name ||
        result.alternativeName ||
        result.enName ||
        "Без названия",
      type:
        result.type === "tv-series" || result.type === "mini-series"
          ? "show"
          : "movie",
      status: "planned",
      image: result.poster?.previewUrl || result.poster?.url,
      description: result.description || result.shortDescription,
      year: result.year,
      rating: result.rating?.kp || result.rating?.imdb,
      source: "kinopoisk",
      externalId: result.id.toString(),
      tags: result.genres ? result.genres.map((g) => g.name) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    logger.error("Kinopoisk Search Error", CONTEXT, error);
    return [];
  }
};
export const getKinopoiskDetails = async (id: string): Promise<any> => {
  try {
    const data = await kinopoiskClient.get<any>(`/movie/${id}`, {
      settingsKey: "kinopoisk_key",
      envKey: "VITE_KINOPOISK_API_KEY",
    });

    if (!data) return null;

    // Find a YouTube trailer
    const trailer = data.videos?.trailers?.find(
      (v: any) =>
        v.site === "youtube" ||
        v.url?.includes("youtube.com") ||
        v.url?.includes("youtu.be"),
    );
    let trailerUrl = trailer?.url;
    if (trailerUrl && trailerUrl.includes("watch?v=")) {
      trailerUrl = trailerUrl.replace("watch?v=", "embed/");
    }

    return {
      description: data.description || data.shortDescription,
      genres: data.genres?.map((g: any) => g.name) || [],
      trailer: trailerUrl,
      related:
        data.similarMovies?.slice(0, 6).map((r: any) => ({
          externalId: r.id.toString(),
          title: r.name || r.enName || r.alternativeName,
          image: r.poster?.previewUrl || r.poster?.url,
          type:
            r.type === "tv-series" || r.type === "mini-series"
              ? "show"
              : "movie",
          source: "kinopoisk",
        })) || [],
      providers:
        data.watchability?.items?.map((p: any) => ({
          name: p.name,
          logo:
            p.logo?.url &&
            p.logo.url.includes("avatars.mds.yandex.net") &&
            !p.logo.url.endsWith("/")
              ? `${p.logo.url}/orig`
              : p.logo?.url,
        })) || [],
    };
  } catch (error) {
    console.error("Kinopoisk Details Error:", error);
    return null;
  }
};
