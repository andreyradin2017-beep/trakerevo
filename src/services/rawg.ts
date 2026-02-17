import { rawgClient } from "./apiClient";
import type { Item } from "../types";
import { fetchHLTBStats } from "./hltb";

const defaultConfig = {
  settingsKey: "rawg_key",
  envKey: "VITE_RAWG_API_KEY",
};

export const searchGames = async (query: string): Promise<Item[]> => {
  const data = await rawgClient.get<any>("/games", {
    ...defaultConfig,
    params: {
      search: query,
      page_size: 20,
    },
  });

  if (!data?.results) return [];

  return data.results.map((game: any) => ({
    title: game.name,
    type: "game",
    status: "planned",
    image: game.background_image,
    description: undefined,
    year: game.released ? new Date(game.released).getFullYear() : undefined,
    rating: game.rating,
    source: "rawg",
    externalId: game.id.toString(),
    tags: game.genres.map((g: any) => g.name),
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

export const getGameDetails = async (id: string): Promise<any> => {
  const data = await rawgClient.get<any>(`/games/${id}`, defaultConfig);
  if (!data) return null;

  // Fetch suggested games separately
  const suggestedData = await rawgClient.get<any>(`/games/${id}/suggested`, {
    ...defaultConfig,
    params: { page_size: 6 },
  });

  const related = (suggestedData?.results || []).map((game: any) => ({
    title: game.name,
    type: "game",
    status: "planned",
    image: game.background_image,
    year: game.released ? new Date(game.released).getFullYear() : undefined,
    source: "rawg",
    externalId: game.id.toString(),
    tags: game.genres?.map((g: any) => g.name) || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Fetch HLTB stats
  const hltb = await fetchHLTBStats(data.name);

  return {
    description: data.description_raw || data.description,
    related,
    hltb,
    providers: [],
  };
};

export const getPopularGames = async (): Promise<string[]> => {
  const data = await rawgClient.get<any>("/games", {
    ...defaultConfig,
    params: {
      ordering: "-added",
      page_size: 6,
    },
  });

  return (data?.results || []).map((game: any) => game.name);
};
