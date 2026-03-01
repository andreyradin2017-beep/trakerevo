interface ITmdbProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TmdbSearchResult {
  page: number;
  results: TmdbMovieResult[] | TmdbTvResult[];
  total_pages: number;
  total_results: number;
}

export interface TmdbMovieResult {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
  media_type?: "movie";
}

export interface TmdbTvResult {
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  id: number;
  name: string;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  media_type?: "tv";
}

export interface TmdbMovieDetails {
  adult: boolean;
  backdrop_path: string | null;
  belongs_to_collection: null | object;
  budget: number;
  genres: { id: number; name: string }[];
  homepage: string;
  id: number;
  imdb_id: string;
  origin_country: string[];
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  production_companies: ITmdbProductionCompany[];
  production_countries: { iso_3166_1: string; name: string }[];
  release_date: string;
  revenue: number;
  runtime: number; // in minutes
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface KinopoiskFilm {
  filmId?: number; // Legacy
  kinopoiskId?: number;
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
  posterUrl?: string;
  posterUrlPreview?: string;
  type: "FILM" | "TV_SERIES" | "TV_SHOW" | "MINI_SERIES" | "VIDEO";
  year?: string;
  description?: string;
  rating?: string;
  ratingKinopoisk?: string;
  ratingImdb?: string;
  genres?: { genre: string }[];
}

export interface KinopoiskSearchResponse {
  films: KinopoiskFilm[];
  pagesCount: number;
  page: number;
}

export interface KinopoiskFilmDetails {
  kinopoiskId: number;
  filmId?: number; // Legacy, kept for compatibility
  nameRu?: string;
  nameEn?: string;
  nameOriginal?: string;
  posterUrl?: string;
  posterUrlPreview?: string;
  type: "FILM" | "TV_SERIES" | "TV_SHOW" | "MINI_SERIES" | "VIDEO";
  year?: string | number;
  description?: string;
  rating?: string | number;
  ratingKinopoisk?: string | number;
  ratingImdb?: string | number;
  genres?: { genre: string }[];
  countries?: { country: string }[];
  duration?: number;
  filmLength?: number;
  slogan?: string;
  ageRating?: string;
  ratingMpaa?: string;
  ratingAgeLimits?: number;
}

export interface KinopoiskSeason {
  number: number;
  episodes?: KinopoiskEpisode[];
}

export interface KinopoiskEpisode {
  episodeNumber: number;
  nameRu?: string;
  nameEn?: string;
  synopsis?: string;
  releaseDate?: string;
}

export interface KinopoiskStaff {
  staffId: number;
  nameRu?: string;
  nameEn?: string;
  description?: string;
  profession?: string;
  professionText?: string;
  professionKey?: string;
  posterUrl?: string;
}

export interface KinopoiskTopResponse {
  pagesCount: number;
  films: KinopoiskFilm[]; // v2.1
  items?: KinopoiskFilm[]; // v2.2
}

export interface KinopoiskFiltersResponse {
  genres: { id: number; genre: string }[];
  countries: { id: number; country: string }[];
  year: { min: number; max: number };
  ratingKinopoisk: { min: number; max: number };
  ratingImdb: { min: number; max: number };
}

export interface KinopoiskTrailer {
  url: string;
  name: string;
  site: string;
  type: string;
}

export interface KinopoiskSimilarFilm {
  filmId: number;
  nameRu: string;
  nameEn: string;
  nameOriginal: string;
  posterUrl: string;
  posterUrlPreview: string;
  relationType: string;
}

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  released: string;
  tba: boolean;
  background_image: string;
  rating: number;
  rating_top: number;
  ratings?: any[];
  ratings_count: number;
  reviews_text_count: number;
  added: number;
  added_by_status?: any;
  metacritic: number;
  playtime: number;
  suggestions_count: number;
  updated: string;
  user_game?: any;
  reviews_count: number;
  saturated_color: string;
  dominant_color: string;
  platforms?: any[];
  parent_platforms?: any[];
  genres: { id: number; name: string; slug: string }[];
  stores?: any[];
  clip?: any;
  tags?: any[];
  esrb_rating?: any;
  short_screenshots?: any[];
}

export interface RawgSearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawgGame[];
}
