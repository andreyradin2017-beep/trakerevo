export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  media_type: "movie" | "tv";
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  vote_average?: number;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
}

export interface TMDBVideo {
  key: string;
  site: string;
  type: string;
}

export interface TMDBWatchProviders {
  results: {
    [key: string]: {
      flatrate?: { provider_name: string; logo_path: string }[];
    };
  };
}

export interface RAWGGame {
  id: number;
  name: string;
  background_image: string;
  released: string;
  rating: number;
  genres: { name: string }[];
  description_raw?: string;
  description?: string;
}

export interface RAWGSearchResponse {
  results: RAWGGame[];
}

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail: string };
    publishedDate?: string;
    categories?: string[];
  };
}

export interface GoogleBooksResponse {
  items?: GoogleBook[];
}
