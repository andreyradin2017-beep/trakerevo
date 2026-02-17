import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { db } from "../db/db";

export interface ApiClientConfig extends AxiosRequestConfig {
  settingsKey?: string;
  envKey?: string;
}

class ApiClient {
  private instance: AxiosInstance;
  private provider: string;

  constructor(baseURL: string, provider: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });
    this.provider = provider;
  }

  private async getApiKey(
    config: ApiClientConfig,
  ): Promise<string | undefined> {
    if (config.settingsKey) {
      try {
        const settings = await db.settings.get(config.settingsKey);
        if (settings?.value) return settings.value;
      } catch (e) {
        console.error("Error fetching setting:", config.settingsKey, e);
      }
    }
    if (config.envKey) {
      return import.meta.env[config.envKey];
    }
    return undefined;
  }

  async request<T>(config: ApiClientConfig): Promise<T | null> {
    try {
      const apiKey = await this.getApiKey(config);

      // Merge params/headers with API key if needed
      const params = { ...(config.params || {}) };
      const headers = { ...(config.headers || {}) };

      if (apiKey) {
        if (this.provider === "tmdb") {
          params.api_key = apiKey;
        } else if (this.provider === "rawg") {
          params.key = apiKey;
        } else if (this.provider === "google_books") {
          params.key = apiKey;
        } else if (this.provider === "kinopoisk") {
          headers["X-API-KEY"] = apiKey;
          headers["Content-Type"] = "application/json";
        }
      }

      const response = await this.instance.request<T>({
        ...config,
        params,
        headers,
      });

      // Handle successful status but empty/error bodies or 4xx status
      if (response.status === 401 || response.status === 402) {
        console.warn(
          `Unauthorized API access [${this.provider}]: Please check your API key.`,
        );
        return null;
      }

      if (response.status >= 400) {
        console.error(
          `API Error [${this.provider}]:`,
          response.status,
          response.statusText,
        );
        return null;
      }

      return response.data;
    } catch (error) {
      console.error(`API Error [${this.provider}]:`, error);
      return null;
    }
  }

  async get<T>(url: string, config: ApiClientConfig = {}): Promise<T | null> {
    return this.request<T>({ ...config, url, method: "GET" });
  }
}

export const tmdbClient = new ApiClient("https://api.themoviedb.org/3", "tmdb");
export const rawgClient = new ApiClient("https://api.rawg.io/api", "rawg");
export const googleBooksClient = new ApiClient(
  "https://www.googleapis.com/books/v1",
  "google_books",
);
export const kinopoiskClient = new ApiClient(
  "https://api.kinopoisk.dev/v1.4",
  "kinopoisk",
);
