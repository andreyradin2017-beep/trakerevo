import axios from "axios";
import { db } from "../db/db";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export const getMovieDetails = async (
  id: string,
  type: "movie" | "tv" | "show",
): Promise<any> => {
  const settingsKey = await db.settings.get("tmdb_key");
  const apiKey = settingsKey?.value || import.meta.env.VITE_TMDB_API_KEY;
  if (!apiKey) return null;

  const mediaType = type === "movie" ? "movie" : "tv";

  try {
    const [details, videos, recommendations, providers] = await Promise.all([
      axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}`, {
        params: { api_key: apiKey, language: "ru-RU" },
      }),
      axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}/videos`, {
        params: { api_key: apiKey },
      }),
      axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}/recommendations`, {
        params: { api_key: apiKey, language: "ru-RU" },
      }),
      axios.get(`${TMDB_BASE_URL}/${mediaType}/${id}/watch/providers`, {
        params: { api_key: apiKey },
      }),
    ]);

    const trailer = videos.data.results.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube",
    );

    return {
      description: details.data.overview,
      trailer: trailer
        ? `https://www.youtube.com/embed/${trailer.key}`
        : undefined,
      related: recommendations.data.results.slice(0, 6).map((r: any) => ({
        id: r.id.toString(),
        title: r.title || r.name,
        image: r.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w200${r.poster_path}`,
            )
          : undefined,
        type: mediaType === "movie" ? "movie" : "show",
      })),
      providers:
        providers.data.results?.RU?.flatrate?.map((p: any) => ({
          name: p.provider_name,
          logo: getProxiedImageUrl(
            `https://image.tmdb.org/t/p/original${p.logo_path}`,
          ),
        })) || [],
    };
  } catch (error) {
    console.error("TMDB Details Error:", error);
    return null;
  }
};

export const searchMovies = async (query: string): Promise<Item[]> => {
  // 1. Try to get key from DB
  const settingsKey = await db.settings.get("tmdb_key");
  let apiKey = settingsKey?.value;

  // 2. Fallback to env var
  if (!apiKey) {
    apiKey = import.meta.env.VITE_TMDB_API_KEY;
  }

  if (!apiKey) return [];

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/multi`, {
      params: {
        api_key: apiKey,
        language: "ru-RU",
        query: query,
      },
    });

    return response.data.results
      .filter(
        (result: any) =>
          result.media_type === "movie" || result.media_type === "tv",
      )
      .map((result: any) => ({
        title: result.title || result.name,
        type:
          result.media_type === "movie"
            ? "movie"
            : result.media_type === "tv"
              ? "movie"
              : "other", // Mapping tv to movie for now or handle 'show' if we had it
        status: "planned",
        image: result.poster_path
          ? `https://image.tmdb.org/t/p/w200${result.poster_path}`
          : undefined,
        description: result.overview,
        year: result.release_date
          ? new Date(result.release_date).getFullYear()
          : result.first_air_date
            ? new Date(result.first_air_date).getFullYear()
            : undefined,
        source: "tmdb",
        externalId: result.id.toString(),
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  } catch (error) {
    console.error("TMDB Search Error:", error);
    return [];
  }
};
