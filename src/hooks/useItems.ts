import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db/db";
import type { Category } from "../components/CategorySelector";

export type SortOption = "dateAdded" | "rating" | "releaseDate" | "title";

export function useRecentItems(
  category: Category,
  sortBy: SortOption = "dateAdded",
) {
  return useLiveQuery(async () => {
    const all = await db.items.toArray();

    let sorted = all;

    // Apply sorting
    switch (sortBy) {
      case "dateAdded":
        sorted = all.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case "rating":
        sorted = all.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "releaseDate":
        sorted = all.sort((a, b) => {
          const dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
          const dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
          return dateB - dateA; // Newest first
        });
        break;
      case "title":
        sorted = all.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    // Filter out archived items
    const available = sorted.filter(
      (item) =>
        (item as any).isArchived !== true && (item as any).isArchived !== 1,
    );

    if (category === "all") {
      return available.slice(0, 50); // Increased limit slightly to show more sorted items
    }
    return available.filter((item) => item.type === category);
  }, [category, sortBy]);
}

import { searchService } from "../services/searchService";

export function useLibrarySearch(query: string, category: Category) {
  return useLiveQuery(async () => {
    const trimmedQuery = query.trim().toLowerCase();
    const all = await db.items.toArray();

    // 1. Ensure search index is up to date
    // Note: searchService.isReady() only tells us if it was EVER indexed.
    // For a highly dynamic app, we could sync index in db.on('changes'),
    // but bulk index check is a good starting point for offline search.
    if (!searchService.isReady()) {
      await searchService.indexAll(all);
    }

    // 2. Perform search
    if (!trimmedQuery) {
      // Fallback to simple filtering (show all) when query is empty
      return all
        .filter((item) => {
          const matchesCategory = category === "all" || item.type === category;
          const isUnarchived =
            (item as any).isArchived !== true && (item as any).isArchived !== 1;
          return matchesCategory && isUnarchived;
        })
        .map((i) => ({ ...i, isOwned: true }));
    }

    // Use FlexSearch for actual queries
    const matchingIds = await searchService.search(trimmedQuery);

    return all
      .filter((item) => {
        const id = item.id;
        const isMatch = id !== undefined && matchingIds.includes(id);
        const matchesCategory = category === "all" || item.type === category;
        const isUnarchived =
          (item as any).isArchived !== true && (item as any).isArchived !== 1;

        return isMatch && matchesCategory && isUnarchived;
      })
      .map((i) => ({ ...i, isOwned: true }));
  }, [query, category]);
}
