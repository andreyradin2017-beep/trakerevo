import axios, { type AxiosInstance } from "axios";
import { db } from "../db/db";

// Helper to get key from DB or LocalStorage
const getStoredKey = async (
  settingsKey: string,
): Promise<string | undefined> => {
  const local = localStorage.getItem(settingsKey);
  if (local && local !== "test-key" && local.trim() !== "") return local;

  try {
    const s = await db.settings.get(settingsKey);
    if (s?.value) return s.value;
  } catch (e) {}
  return undefined;
};

export const createApiClient = (
  baseURL: string,
  timeout = 15000,
): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout,
    validateStatus: (status) => status < 500,
  });
};

export const tmdbClient = createApiClient("https://api.themoviedb.org/3");
export const rawgClient = createApiClient("https://api.rawg.io/api");
export const googleBooksClient = createApiClient(
  "https://www.googleapis.com/books/v1",
);

// --- TMDB Interceptor ---
tmdbClient.interceptors.request.use(async (config) => {
  const key =
    (await getStoredKey("tmdb_key")) || import.meta.env.VITE_TMDB_API_KEY;
  if (key) config.params = { ...config.params, api_key: key };
  return config;
});

// --- RAWG Interceptor ---
rawgClient.interceptors.request.use(async (config) => {
  const key =
    (await getStoredKey("rawg_key")) || import.meta.env.VITE_RAWG_API_KEY;
  if (key) config.params = { ...config.params, key: key };
  return config;
});

// --- Google Books Interceptor ---
googleBooksClient.interceptors.request.use(async (config) => {
  const key =
    (await getStoredKey("google_books_key")) ||
    import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
  if (key) config.params = { ...config.params, key: key };
  return config;
});
