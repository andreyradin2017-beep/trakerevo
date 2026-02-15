import axios from "axios";
import { db } from "../db/db";
import type { Item } from "../types";

const KINOPOISK_BASE_URL = "https://api.kinopoisk.dev/v1.4";

export const searchKinopoisk = async (query: string): Promise<Item[]> => {
  // 1. Try to get key from DB (in case user overrides it later)
  const settingsKey = await db.settings.get("kinopoisk_key");
  let apiKey = settingsKey?.value;

  // 2. Fallback to env var
  if (!apiKey) {
    apiKey = import.meta.env.VITE_KINOPOISK_API_KEY;
  }

  if (!apiKey) return [];

  try {
    const response = await axios.get(`${KINOPOISK_BASE_URL}/movie/search`, {
      headers: {
        "X-API-KEY": apiKey,
      },
      params: {
        query: query,
        limit: 10,
      },
    });

    if (!response.data || !response.data.docs) {
      return [];
    }

    return response.data.docs.map((result: any) => ({
      title: result.name || result.alternativeName || result.enName,
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
      tags: result.genres ? result.genres.map((g: any) => g.name) : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error("Kinopoisk Search Error:", error);
    return [];
  }
};
export const getKinopoiskDetails = async (id: string): Promise<any> => {
  const settingsKey = await db.settings.get("kinopoisk_key");
  let apiKey = settingsKey?.value || import.meta.env.VITE_KINOPOISK_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(`${KINOPOISK_BASE_URL}/movie/${id}`, {
      headers: { "X-API-KEY": apiKey },
    });

    const data = response.data;

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
      trailer: trailerUrl,
      related:
        data.similarMovies?.slice(0, 6).map((r: any) => ({
          id: r.id.toString(),
          title: r.name || r.enName || r.alternativeName,
          image: r.poster?.previewUrl || r.poster?.url,
          type:
            r.type === "tv-series" || r.type === "mini-series"
              ? "show"
              : "movie",
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
