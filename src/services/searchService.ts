import { Document } from "flexsearch";
import type { Item } from "../types";

// Index configuration
// We use 'Document' for multi-field indexing (title, description, tags)
const index = new Document({
  document: {
    id: "id",
    index: ["title", "description", "original_title", "tags"],
    store: true, // We store the whole object for easy retrieval, or just IDs
  },
  tokenize: "full", // Good for suffix/prefix matching
  cache: true,
  context: true,
});

let isIndexed = false;

export const searchService = {
  /**
   * Bulk index items from the database
   */
  async indexAll(items: Item[]) {
    // Clear index first if re-indexing
    // FlexSearch doesn't have a simple 'clear', so we might need to recreate or just add
    items.forEach((item) => {
      if (item.id) {
        index.add({
          id: item.id,
          title: item.title,
          description: item.description || "",
          original_title: (item as any).original_title || "",
          tags: (item.tags || []).join(" "),
        });
      }
    });
    isIndexed = true;
  },

  /**
   * Add or update a single item in the index
   */
  async upsertItem(item: Item) {
    if (item.id) {
      index.add({
        id: item.id,
        title: item.title,
        description: item.description || "",
        original_title: (item as any).original_title || "",
        tags: (item.tags || []).join(" "),
      });
    }
  },

  /**
   * Remove an item from the index
   */
  async removeItem(id: number) {
    index.remove(id);
  },

  /**
   * Perform a fuzzy search
   */
  async search(query: string): Promise<number[]> {
    if (!query.trim()) return [];

    // FlexSearch returns results in a complex format for Document index:
    // [{ field: 'title', result: [id1, id2] }, { field: 'description', result: [id3] }]
    const rawResults = await index.search(query, {
      limit: 50,
      suggest: true, // Enable suggestion/fuzzy
    });

    // Flatten and deduplicate IDs
    const allIds = new Set<number>();
    rawResults.forEach((fieldResult: any) => {
      fieldResult.result.forEach((id: number) => allIds.add(id));
    });

    return Array.from(allIds);
  },

  isReady() {
    return isIndexed;
  },
};
