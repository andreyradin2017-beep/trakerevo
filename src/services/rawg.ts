import axios from 'axios';
import { db } from '../db/db';
import type { Item } from '../types';

const RAWG_BASE_URL = 'https://api.rawg.io/api';

export const searchGames = async (query: string): Promise<Item[]> => {
    const settingsKey = await db.settings.get('rawg_key');
    let apiKey = settingsKey?.value || import.meta.env.VITE_RAWG_API_KEY;

    if (!apiKey) return [];

    try {
        const response = await axios.get(`${RAWG_BASE_URL}/games`, {
            params: {
                key: apiKey,
                search: query,
                page_size: 10
            },
        });

        return response.data.results.map((game: any) => ({
            title: game.name,
            type: 'game',
            status: 'planned',
            image: game.background_image,
            description: undefined, // RAWG search results don't usually have full descriptions
            year: game.released ? new Date(game.released).getFullYear() : undefined,
            rating: game.rating,
            source: 'rawg',
            externalId: game.id.toString(),
            tags: game.genres.map((g: any) => g.name),
            createdAt: new Date(),
            updatedAt: new Date(),
        }));
    } catch (error) {
        console.error('RAWG Search Error:', error);
        return [];
    }
};
