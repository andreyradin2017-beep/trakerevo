export type ItemType = "movie" | "show" | "game" | "book" | "other";
export type ItemStatus = "planned" | "in_progress" | "completed" | "dropped";

export interface Item {
  id?: number;
  title: string;
  type: ItemType;
  status: ItemStatus;
  image?: string;
  description?: string;
  year?: number;
  rating?: number; // User rating 0-10
  progress?: number; // e.g. episodes watched, pages read
  totalProgress?: number; // total episodes, total pages

  // Series support
  currentSeason?: number;
  currentEpisode?: number;
  episodesPerSeason?: number[]; // count of episodes in each season

  // Archive support
  isArchived?: boolean;

  // API Metadata
  trailerUrl?: string;
  watchProviders?: { name: string; logo: string; url?: string }[];
  relatedExternalIds?: string[];

  notes?: string;
  tags: string[];
  externalId?: string;
  source?: "tmdb" | "rawg" | "google_books" | "kinopoisk" | "yandex" | "manual";
  supabaseId?: string; // UUID from Supabase
  createdAt: Date;
  updatedAt: Date;
  listId?: number;
}

export interface List {
  id?: number;
  supabaseId?: string; // UUID from Supabase
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt?: Date; // Added for sync
}

export interface Settings {
  key: string;
  value: any;
}
