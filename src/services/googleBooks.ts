import type { Item } from "../types";
import type { GoogleBooksResponse, GoogleBook } from "../types/api";
import { googleBooksClient } from "./apiClient";

export const searchBooks = async (query: string): Promise<Item[] | null> => {
  try {
    const response = await googleBooksClient.get<GoogleBooksResponse>(
      "/volumes",
      {
        params: { q: query, maxResults: 20, langRestrict: "ru" },
      },
    );

    const data = response.data;
    if (!data?.items) return null;

    return data.items.map((book) => {
      const info = book.volumeInfo;
      return {
        title: info.title,
        type: "book" as const,
        status: "planned" as const,
        image: info.imageLinks?.thumbnail,
        description: info.description,
        year: info.publishedDate
          ? new Date(info.publishedDate).getFullYear()
          : undefined,
        source: "google_books" as const,
        externalId: book.id,
        authors: info.authors || [],
        tags: info.categories || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });
  } catch (error) {
    console.error("Google Books Search Error:", error);
    return null;
  }
};

export const getBookDetails = async (id: string): Promise<any> => {
  try {
    const response = await googleBooksClient.get<GoogleBook>(`/volumes/${id}`);
    const data = response.data;
    if (!data) return null;

    const info = data.volumeInfo;
    return {
      title: info.title,
      image: info.imageLinks?.thumbnail,
      description: info.description,
      authors: info.authors || [],
      genres: info.categories || [],
      related: [],
      providers: [],
      type: "book",
    };
  } catch (error) {
    console.error("Google Books Details Error:", error);
    return null;
  }
};
