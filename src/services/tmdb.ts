import { tmdbClient } from "./apiClient";
import type { Item } from "../types";
import { getProxiedImageUrl } from "../utils/images";

const defaultConfig = {
  settingsKey: "tmdb_key",
  envKey: "VITE_TMDB_API_KEY",
};

export const getMovieDetails = async (
  id: string,
  type: "movie" | "tv" | "show",
): Promise<any> => {
  const mediaType = type === "movie" ? "movie" : "tv";

  const [details, videos, recommendations, providers] = await Promise.all([
    tmdbClient.get<any>(`/${mediaType}/${id}`, {
      ...defaultConfig,
      params: { language: "ru-RU" },
    }),
    tmdbClient.get<any>(`/${mediaType}/${id}/videos`, defaultConfig),
    tmdbClient.get<any>(`/${mediaType}/${id}/recommendations`, {
      ...defaultConfig,
      params: { language: "ru-RU" },
    }),
    tmdbClient.get<any>(`/${mediaType}/${id}/watch/providers`, defaultConfig),
  ]);

  if (!details) return null;

  const trailer = videos?.results?.find(
    (v: any) => v.type === "Trailer" && v.site === "YouTube",
  );

  return {
    description: details.overview,
    genres: details.genres?.map((g: any) => g.name) || [],
    trailer: trailer
      ? `https://www.youtube.com/embed/${trailer.key}`
      : undefined,
    related: (recommendations?.results || []).slice(0, 6).map((r: any) => ({
      externalId: r.id.toString(),
      title: r.title || r.name,
      image: r.poster_path
        ? getProxiedImageUrl(`https://image.tmdb.org/t/p/w200${r.poster_path}`)
        : undefined,
      type: r.media_type === "tv" ? "show" : "movie",
      source: "tmdb",
    })),
    providers:
      providers?.results?.RU?.flatrate?.map((p: any) => ({
        name: p.provider_name,
        logo: getProxiedImageUrl(
          `https://image.tmdb.org/t/p/original${p.logo_path}`,
        ),
      })) || [],
  };
};

export const searchMovies = async (query: string): Promise<Item[]> => {
  const data = await tmdbClient.get<any>("/search/multi", {
    ...defaultConfig,
    params: {
      language: "ru-RU",
      query: query,
    },
  });

  if (!data?.results) return [];

  return data.results
    .filter(
      (result: any) =>
        result.media_type === "movie" || result.media_type === "tv",
    )
    .map((result: any) => ({
      title: result.title || result.name,
      type: result.media_type === "tv" ? "show" : "movie",
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
};

export const getTrendingMovies = async (
  timeWindow: "day" | "week" = "day",
): Promise<string[]> => {
  const data = await tmdbClient.get<any>(`/trending/all/${timeWindow}`, {
    ...defaultConfig,
    params: { language: "ru-RU" },
  });

  return (data?.results || [])
    .slice(0, 6)
    .map((r: any) => r.title || r.name)
    .filter(Boolean);
};
