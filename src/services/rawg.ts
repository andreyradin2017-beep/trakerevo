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

    // Separate call for suggested games to handle potential 401/403 errors gracefully
    let related: any[] = [];
    try {
      const suggestedResponse = await rawgClient.get<RAWGSearchResponse>(
        `/games/${id}/suggested`,
        {
          params: { page_size: 6 },
        },
      );
      if (suggestedResponse.status === 200 && suggestedResponse.data?.results) {
        related = suggestedResponse.data.results.map((game) => ({
          title: game.name,
          type: "game" as const,
          status: "planned" as const,
          image: game.background_image,
          year: game.released
            ? new Date(game.released).getFullYear()
            : undefined,
          source: "rawg" as const,
          externalId: game.id.toString(),
          tags: game.genres?.map((g) => g.name) || [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
    } catch (suggestedErr) {
      console.warn(
        "RAWG Suggested Games failed (likely API limit/key restriction):",
        suggestedErr,
      );
    }

    const hltb = await fetchHLTBStats(data.name);

    // Strip HTML tags from description
    const cleanDescription = (data.description_raw || data.description || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    return {
      title: data.name,
      image: data.background_image,
      description: cleanDescription,
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
