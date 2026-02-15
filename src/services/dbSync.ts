import { db } from "../db/db";
import { supabase } from "./supabase";
import type { Item, List } from "../types";

// Helper to map Local List -> Remote List
const toRemoteList = (list: List, userId: string): any => {
  return {
    id: list.supabaseId, // If undefined, Supabase generates one
    user_id: userId,
    name: list.name,
    icon: list.icon,
    description: list.description,
    created_at: list.createdAt.toISOString(),
    updated_at: list.updatedAt
      ? list.updatedAt.toISOString()
      : new Date().toISOString(),
    local_id: list.id,
  };
};

// Helper to map Remote List -> Local List
const toLocalList = (remote: any): List => {
  return {
    id: remote.local_id || undefined, // We might not have local_id if created elsewhere
    supabaseId: remote.id,
    name: remote.name,
    icon: remote.icon,
    description: remote.description,
    createdAt: new Date(remote.created_at),
    updatedAt: new Date(remote.updated_at),
  };
};

// Helper to map Local Item -> Remote Item
const toRemoteItem = async (item: Item, userId: string): Promise<any> => {
  let listUuid = null;
  if (item.listId) {
    // We need to find the UUID of the list
    const list = await db.lists.get(item.listId);
    if (list && list.supabaseId) {
      listUuid = list.supabaseId;
    }
  }

  return {
    id: item.supabaseId,
    user_id: userId,
    title: item.title,
    type: item.type,
    status: item.status,
    image: item.image,
    description: item.description,
    year: item.year,
    rating: item.rating,
    progress: item.progress,
    total_progress: item.totalProgress,
    current_season: item.currentSeason,
    current_episode: item.currentEpisode,
    episodes_per_season: item.episodesPerSeason,
    is_archived: item.isArchived,
    trailer_url: item.trailerUrl,
    watch_providers: item.watchProviders,
    related_external_ids: item.relatedExternalIds,
    notes: item.notes,
    tags: item.tags,
    external_id: item.externalId,
    source: item.source,
    created_at: item.createdAt.toISOString(),
    updated_at: item.updatedAt.toISOString(),
    list_id: listUuid, // Map local list ID to UUID
    local_id: item.id,
  };
};

// Helper to map Remote Item -> Local Item
const toLocalItem = async (remote: any): Promise<Item> => {
  let localListId = undefined;
  if (remote.list_id) {
    // Find local list by supabaseId
    const list = await db.lists
      .where("supabaseId")
      .equals(remote.list_id)
      .first();
    if (list) {
      localListId = list.id;
    }
  }

  return {
    id: remote.local_id || undefined,
    supabaseId: remote.id,
    title: remote.title,
    type: remote.type as any,
    status: remote.status as any,
    image: remote.image,
    description: remote.description,
    year: remote.year,
    rating: remote.rating,
    progress: remote.progress,
    totalProgress: remote.total_progress,
    currentSeason: remote.current_season,
    currentEpisode: remote.current_episode,
    episodesPerSeason: remote.episodes_per_season,
    isArchived: remote.is_archived,
    trailerUrl: remote.trailer_url,
    watchProviders: remote.watch_providers,
    relatedExternalIds: remote.related_external_ids,
    notes: remote.notes,
    tags: remote.tags || [],
    externalId: remote.external_id,
    source: remote.source as any,
    createdAt: new Date(remote.created_at),
    updatedAt: new Date(remote.updated_at),
    listId: localListId,
  };
};

export const syncLists = async (userId: string) => {
  // 1. PUSH: Send local lists that are new or updated
  const localLists = await db.lists.toArray();

  for (const list of localLists) {
    if (!list.supabaseId) {
      // New list -> Insert
      const { data, error } = await supabase
        .from("lists")
        .insert(toRemoteList(list, userId))
        .select()
        .single();

      if (!error && data) {
        await db.lists.update(list.id!, { supabaseId: data.id });
      }
    } else {
      // Existing list -> Update if needed (simple check for now can be refined)
      // For strict sync we should check updatedAt, but for now let's just upsert all that have ID
      // Actually, let's only upsert if we think we might have changes.
      // A better way is "Last Write Wins".
      // Let's assume local is source of truth for now if it has changed recently.
      const { error } = await supabase
        .from("lists")
        .update(toRemoteList(list, userId))
        .eq("id", list.supabaseId);
      if (error) console.error("Error updating list", error);
    }
  }

  // 2. PULL: Get all remote lists
  const { data: remoteLists, error } = await supabase.from("lists").select("*");
  if (error || !remoteLists) return;

  for (const remote of remoteLists) {
    const local = localLists.find((l) => l.supabaseId === remote.id);

    if (!local) {
      // New remote list -> Create local - use put() to avoid constraint errors
      await db.lists.put(toLocalList(remote));
    } else {
      // Conflict resolution: Remote wins if remote.updated_at > local.updatedAt
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = local.updatedAt ? local.updatedAt.getTime() : 0;

      if (remoteTime > localTime) {
        // Check if we already have this ID? Dexie might just update.
        // But toLocalList sets local_id if present.
        const mapped = toLocalList(remote);
        // Preserve local ID reference for update
        mapped.id = local.id;
        await db.lists.put(mapped);
      }
    }
  }
};

export const syncItems = async (userId: string) => {
  // 1. PUSH
  const localItems = await db.items.toArray();
  for (const item of localItems) {
    const payload = await toRemoteItem(item, userId);

    if (!item.supabaseId) {
      const { data, error } = await supabase
        .from("items")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        await db.items.update(item.id!, { supabaseId: data.id });
      } else {
        console.error("Failed to push item", item.title, error);
      }
    } else {
      const { error } = await supabase
        .from("items")
        .update(payload)
        .eq("id", item.supabaseId);
      if (error) console.error("Failed to update item", item.title, error);
    }
  }

  // 2. PULL
  const { data: remoteItems, error } = await supabase.from("items").select("*");
  if (error || !remoteItems) return;

  for (const remote of remoteItems) {
    // We need to find local item by supabaseId OR by finding matching externalId/source for initial sync?
    // Let's stick to supabaseId for now.
    const local = localItems.find((i) => i.supabaseId === remote.id);
    const mapped = await toLocalItem(remote);

    if (!local) {
      // New remote item - use put() instead of add() to avoid constraint errors
      // if item already exists with same auto-increment ID
      await db.items.put(mapped);
    } else {
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = local.updatedAt.getTime();

      if (remoteTime > localTime) {
        mapped.id = local.id;
        await db.items.put(mapped);
      }
    }
  }
};

export const syncAll = async (): Promise<{
  success: boolean;
  errors: string[];
}> => {
  const errors: string[] = [];
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    errors.push("Пользователь не авторизован");
    return { success: false, errors };
  }

  try {
    console.log("Starting Sync...");

    try {
      await syncLists(session.user.id);
      console.log("✓ Lists synced");
    } catch (err) {
      const msg = `Ошибка синхронизации списков: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg, err);
      errors.push(msg);
    }

    try {
      await syncItems(session.user.id);
      console.log("✓ Items synced");
    } catch (err) {
      const msg = `Ошибка синхронизации элементов: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg, err);
      errors.push(msg);
    }

    console.log("Sync Completed.");
    return { success: errors.length === 0, errors };
  } catch (error) {
    const msg = `Критическая ошибка синхронизации: ${error instanceof Error ? error.message : String(error)}`;
    console.error(msg, error);
    errors.push(msg);
    return { success: false, errors };
  }
};
