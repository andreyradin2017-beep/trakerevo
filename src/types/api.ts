/**
 * TMDB API Types
 */
export interface TMDBMovieResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
  media_type?: "movie" | "tv";
}

/**
 * Kinopoisk API Types
 */
export interface KinopoiskMovieResult {
  id: number;
  name?: string;
  alternativeName?: string;
  enName?: string;
  type?: string;
  poster?: {
    url?: string;
    previewUrl?: string;
  };
  description?: string;
  shortDescription?: string;
  year?: number;
  rating?: {
    kp?: number;
    imdb?: number;
  };
  genres?: { name: string }[];
}

/**
 * RAWG API Types
 */
export interface RAWGGameResult {
  id: number;
  name: string;
  background_image?: string;
  released?: string;
  rating?: number;
  description_raw?: string;
  genres?: { name: string }[];
  platforms?: { platform: { name: string } }[];
}

/**
 * Google Books API Types
 */
export interface GoogleBookResult {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
  };
}
