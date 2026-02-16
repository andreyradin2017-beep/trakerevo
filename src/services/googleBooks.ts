import axios from "axios";
import { db } from "../db/db";
import type { Item } from "../types";

const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1";

export const searchBooks = async (query: string): Promise<Item[]> => {
  const settingsKey = await db.settings.get("google_books_key");
  let apiKey = settingsKey?.value || import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

  try {
    const params: any = { q: query, maxResults: 20, langRestrict: "ru" };
    if (apiKey) {
      params.key = apiKey;
    }

    const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes`, {
      params: params,
    });

    if (!response.data.items) return [];

    return response.data.items.map((book: any) => {
      const info = book.volumeInfo;
      return {
        title: info.title,
        type: "book",
        status: "planned",
        image: info.imageLinks?.thumbnail,
        description: info.description,
        year: info.publishedDate
          ? new Date(info.publishedDate).getFullYear()
          : undefined,
        source: "google_books",
        externalId: book.id,
        tags: info.categories || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  } catch (error) {
    console.error("Google Books Search Error:", error);
    return [];
  }
};

export const getBookDetails = async (id: string): Promise<any> => {
  const settingsKey = await db.settings.get("google_books_key");
  const apiKey =
    settingsKey?.value || import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

  try {
    const params: any = {};
    if (apiKey) params.key = apiKey;

    const response = await axios.get(`${GOOGLE_BOOKS_BASE_URL}/volumes/${id}`, {
      params: params,
    });
    const info = response.data.volumeInfo;
    return {
      description: info.description,
      related: [],
      providers: [],
    };
  } catch (error) {
    console.error("Google Books Details Error:", error);
    return null;
  }
};
