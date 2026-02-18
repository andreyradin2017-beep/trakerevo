import { rawgClient } from "./apiClient";
import type { Item } from "../types";
import type { RAWGSearchResponse, RAWGGame } from "../types/api";
import { fetchHLTBStats } from "./hltb";

export const searchGames = async (query: string): Promise<Item[] | null> => {
  try {
    const response = await rawgClient.get<RAWGSearchResponse>("/games", {
      params: {
        search: query,
        page_size: 20,
      },
    });

    const data = response.data;
    if (!data?.results) return null;

    return data.results.map((game) => ({
      title: game.name,
      type: "game",
      status: "planned",
      image: game.background_image,
      description: undefined,
      year: game.released ? new Date(game.released).getFullYear() : undefined,
      rating: game.rating,
      source: "rawg" as const,
      externalId: game.id.toString(),
      tags: game.genres.map((g) => g.name),
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  } catch (error) {
    console.error("RAWG Search Error:", error);
    return null;
  }
};

export const getGameDetails = async (id: string): Promise<any> => {
  try {
    const response = await rawgClient.get<RAWGGame>(`/games/${id}`);
    const data = response.data;
    if (!data) return null;

    const suggestedResponse = await rawgClient.get<RAWGSearchResponse>(
      `/games/${id}/suggested`,
      {
        params: { page_size: 6 },
      },
    );
    const suggestedData = suggestedResponse.data;

    const related = (suggestedData?.results || []).map((game) => ({
      title: game.name,
      type: "game" as const,
      status: "planned" as const,
      image: game.background_image,
      year: game.released ? new Date(game.released).getFullYear() : undefined,
      source: "rawg" as const,
      externalId: game.id.toString(),
      tags: game.genres?.map((g) => g.name) || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const hltb = await fetchHLTBStats(data.name);

    return {
      title: data.name,
      image: data.background_image,
      description: data.description_raw || data.description,
      related,
      hltb,
      providers: [],
      type: "game",
    };
  } catch (error) {
    console.error("RAWG Details Error:", error);
    return null;
  }
};

export const getPopularGames = async (): Promise<string[]> => {
  try {
    const response = await rawgClient.get<RAWGSearchResponse>("/games", {
      params: {
        ordering: "-added",
        page_size: 6,
      },
    });
    const data = response.data;
    return (data?.results || []).map((game) => game.name);
  } catch (error) {
    console.error("RAWG Popular Error:", error);
    return [];
  }
};
