import { tmdbClient } from "./apiClient";
import type { Item } from "../types";
import type {
  TMDBSearchResponse,
  TMDBMovie,
  TMDBVideo,
  TMDBWatchProviders,
} from "../types/api";
import { getProxiedImageUrl } from "../utils/images";

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

export const getMovieDetails = async (
  id: string,
  type: "movie" | "tv" | "show",
): Promise<any> => {
  try {
    const mediaType = type === "movie" ? "movie" : "tv";

    const [detailsRes, videosRes, recRes, providersRes] = await Promise.all([
      tmdbClient.get<TMDBMovie>(`/${mediaType}/${id}`, {
        params: { language: "ru-RU" },
      }),
      tmdbClient.get<{ results: TMDBVideo[] }>(`/${mediaType}/${id}/videos`),
      tmdbClient.get<TMDBSearchResponse>(
        `/${mediaType}/${id}/recommendations`,
        {
          params: { language: "ru-RU" },
        },
      ),
      tmdbClient.get<TMDBWatchProviders>(`/${mediaType}/${id}/watch/providers`),
    ]);

    const details = detailsRes.data;
    if (!details) return null;

    const trailer = videosRes.data?.results?.find(
      (v) =>
        (v.type === "Trailer" || v.type === "Teaser") && v.site === "YouTube",
    );

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
      related: (recRes.data?.results || []).slice(0, 8).map((r) => ({
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
        providersRes.data?.results?.RU?.flatrate?.map((p) => ({
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
    };
  } catch (error) {
    console.error("TMDB Details Error:", error);
    return null;
  }
};

export const searchMovies = async (query: string): Promise<Item[] | null> => {
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
          .map((id) => GENRE_MAP[id])
          .filter(Boolean),
        rating: result.vote_average,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
  } catch (error) {
    console.error("TMDB Search Error:", error);
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
    console.error("TMDB Trending Error:", error);
    return [];
  }
};
