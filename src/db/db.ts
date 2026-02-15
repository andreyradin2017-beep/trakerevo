import Dexie, { type EntityTable } from "dexie";
import type { Item, List, Settings } from "../types";

const db = new Dexie("TrakerEvoDB") as Dexie & {
  items: EntityTable<Item, "id">;
  lists: EntityTable<List, "id">;
  settings: EntityTable<Settings, "key">;
  cache: EntityTable<{ key: string; data: any; timestamp: number }, "key">;
  search_history: EntityTable<{ query: string; timestamp: number }, "query">;
};

db.version(7).stores({
  items:
    "++id, type, status, isArchived, *tags, listId, createdAt, [externalId+source], supabaseId",
  lists: "++id, name, supabaseId",
  settings: "key",
  cache: "key",
  search_history: "query, timestamp",
});

export { db };
