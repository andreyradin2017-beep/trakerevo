import { tmdbClient } from "./apiClient";
import type { Item } from "../types";
import type {
  TMDBSearchResponse,
  TMDBMovie,
  TMDBVideo,
  TMDBWatchProviders,
} from "../types/api";
import { getProxiedImageUrl } from "../utils/images";
import { logger } from "../utils/logger";
import { TMDB_GENRE_MAP } from "../utils/genreMaps";
import { PATTERNS } from "../utils/constants";

export const getMovieDetails = async (
  id: string,
  type: "movie" | "tv" | "show",
): Promise<any> => {
  try {
    const mediaType = type === "movie" ? "movie" : "tv";

    // Primary request for details
    const detailsRes = await tmdbClient.get<TMDBMovie>(`/${mediaType}/${id}`, {
      params: { language: "ru-RU" },
    });

    const details = detailsRes.data;
    if (!details) return null;

    // Side requests - each handled gracefully
    const [videosResult, recResult, providersResult] = await Promise.allSettled(
      [
        tmdbClient.get<{ results: TMDBVideo[] }>(`/${mediaType}/${id}/videos`),
        tmdbClient.get<TMDBSearchResponse>(
          `/${mediaType}/${id}/recommendations`,
          {
            params: { language: "ru-RU" },
          },
        ),
        tmdbClient.get<TMDBWatchProviders>(
          `/${mediaType}/${id}/watch/providers`,
        ),
      ],
    );

    const videosData =
      videosResult.status === "fulfilled" ? videosResult.value.data : null;
    const recData =
      recResult.status === "fulfilled" ? recResult.value.data : null;
    const providersData =
      providersResult.status === "fulfilled"
        ? providersResult.value.data
        : null;

    const trailer = videosData?.results?.find(
      (v) =>
        (v.type === "Trailer" || v.type === "Teaser") &&
        v.site === "YouTube" &&
        PATTERNS.YOUTUBE_ID.test(v.key),
    );

    // Get seasons/episodes info for TV shows
    const episodesPerSeason = mediaType === "tv" && (details as any).seasons
      ? (details as any).seasons
          .filter((s: any) => s.season_number > 0)
          .map((s: any) => s.episode_count || 0)
      : undefined;

    const totalEpisodes = episodesPerSeason
      ? episodesPerSeason.reduce((sum: number, count: number) => sum + count, 0)
      : undefined;

    return {
      title: details.title || details.name,
      image: details.poster_path
        ? getProxiedImageUrl(
            `https://image.tmdb.org/t/p/w500${details.poster_path}`,
          )
        : undefined,
      description: details.overview,
      genres: details.genres?.map((g: any) => g.name) || [],
      trailer: trailer
        ? `https://www.youtube.com/embed/${trailer.key}`
        : undefined,
      related: (recData?.results || []).slice(0, 8).map((r: any) => ({
        externalId: r.id.toString(),
        title: r.title || r.name || "",
        image: r.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w342${r.poster_path}`,
            )
          : undefined,
        type: r.media_type === "tv" ? "show" : "movie",
        source: "tmdb" as const,
      })),
      providers:
        providersData?.results?.RU?.flatrate?.map((p: any) => ({
          name: p.provider_name,
          logo: getProxiedImageUrl(
            `https://image.tmdb.org/t/p/original${p.logo_path}`,
          ),
        })) || [],
      type: mediaType === "tv" ? "show" : "movie",
      year: details.release_date
        ? new Date(details.release_date).getFullYear()
        : details.first_air_date
          ? new Date(details.first_air_date).getFullYear()
          : undefined,
      rating: details.vote_average,
      // TV Show specific data
      totalEpisodes,
      episodesPerSeason,
      numberOfSeasons: (details as any).number_of_seasons,
    };
  } catch (error) {
    logger.error("TMDB Details Error", "tmdb", error);
    return null;
  }
};

export const searchMovies = async (query: string): Promise<Item[] | null> => {
  // Prevent search with empty/undefined query
  if (!query || query.trim() === "") {
    return null;
  }

  try {
    const response = await tmdbClient.get<TMDBSearchResponse>("/search/multi", {
      params: {
        language: "ru-RU",
        query: query,
        include_adult: false,
      },
    });

    const data = response.data;
    if (!data?.results) return null;

    return data.results
      .filter(
        (result: TMDBMovie) =>
          result.media_type === "movie" || result.media_type === "tv",
      )
      .map((result: TMDBMovie) => ({
        title: result.title || result.name || "",
        type: result.media_type === "tv" ? "show" : "movie",
        status: "planned" as const,
        image: result.poster_path
          ? getProxiedImageUrl(
              `https://image.tmdb.org/t/p/w342${result.poster_path}`,
            )
          : undefined,
        description: result.overview,
        year: result.release_date
          ? new Date(result.release_date).getFullYear()
          : result.first_air_date
            ? new Date(result.first_air_date).getFullYear()
            : undefined,
        source: "tmdb" as const,
        externalId: result.id.toString(),
        tags: (result.genre_ids || [])
          .map((id) => TMDB_GENRE_MAP[id])
          .filter(Boolean),
        rating: result.vote_average,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  } catch (error) {
    logger.error("TMDB Search Error", "tmdb", error);
    return null;
  }
};

export const getTrendingMovies = async (
  timeWindow: "day" | "week" = "day",
): Promise<string[]> => {
  try {
    const response = await tmdbClient.get<TMDBSearchResponse>(
      `/trending/all/${timeWindow}`,
      {
        params: { language: "ru-RU" },
      },
    );
    return (response.data?.results || [])
      .slice(0, 10)
      .map((r: TMDBMovie) => r.title || r.name || "")
      .filter(Boolean);
  } catch (error) {
    logger.error("TMDB Trending Error", "tmdb", error);
    return [];
  }
};
