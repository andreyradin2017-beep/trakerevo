import type { Item } from "../types";
import { googleBooksClient } from "./apiClient";

export const searchBooks = async (query: string): Promise<Item[]> => {
  try {
    const data = await googleBooksClient.get<any>("/volumes", {
      settingsKey: "google_books_key",
      envKey: "VITE_GOOGLE_BOOKS_API_KEY",
      params: { q: query, maxResults: 20, langRestrict: "ru" },
    });

    if (!data?.items) return [];

    return data.items.map((book: any) => {
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
        authors: info.authors || [],
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

export const searchByAuthor = async (author: string): Promise<Item[]> => {
  return searchBooks(`inauthor:"${author}"`);
};

export const getBookDetails = async (id: string): Promise<any> => {
  try {
    const data = await googleBooksClient.get<any>(`/volumes/${id}`, {
      settingsKey: "google_books_key",
      envKey: "VITE_GOOGLE_BOOKS_API_KEY",
    });

    if (!data) return null;
    const info = data.volumeInfo;
    return {
      description: info.description,
      authors: info.authors || [],
      genres: info.categories || [],
      related: [],
      providers: [],
    };
  } catch (error) {
    console.error("Google Books Details Error:", error);
    return null;
  }
};
