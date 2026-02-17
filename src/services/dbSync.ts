import { db } from "../db/db";
import { supabase } from "./supabase";
import type { Item, List } from "../types";
import type { RemoteItem, RemoteList } from "../types/supabase";
import type { SyncResult } from "../types/sync";
import { logger } from "../utils/logger";

const CONTEXT = "dbSync";

// Helper to map Local List -> Remote List
const toRemoteList = (list: List, userId: string): RemoteList => {
  return {
    id: list.supabaseId,
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
const toLocalList = (remote: RemoteList): List => {
  return {
    id: remote.local_id || undefined,
    supabaseId: remote.id,
    name: remote.name,
    icon: remote.icon,
    description: remote.description,
    createdAt: new Date(remote.created_at),
    updatedAt: new Date(remote.updated_at),
  };
};

// Helper to map Local Item -> Remote Item
const toRemoteItem = async (
  item: Item,
  userId: string,
): Promise<RemoteItem> => {
  let listUuid: string | undefined = undefined;
  if (item.listId) {
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
    list_id: listUuid,
    local_id: item.id,
  };
};

// Helper to map Remote Item -> Local Item
const toLocalItem = async (remote: RemoteItem): Promise<Item> => {
  let localListId: number | undefined = undefined;
  if (remote.list_id) {
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
    type: remote.type as Item["type"],
    status: remote.status as Item["status"],
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
    source: remote.source as Item["source"],
    createdAt: new Date(remote.created_at),
    updatedAt: new Date(remote.updated_at),
    listId: localListId,
  };
};

export const syncDeletions = async (userId: string): Promise<number> => {
  const deletions = await db.deleted_metadata.toArray();
  let count = 0;
  for (const del of deletions) {
    const { error } = await supabase
      .from(del.table)
      .delete()
      .eq("id", del.id)
      .eq("user_id", userId);

    if (!error) {
      await db.deleted_metadata.delete(del.id);
      count++;
    } else {
      logger.error(
        `Failed to push deletion for ${del.table}:${del.id}`,
        CONTEXT,
        error,
      );
    }
  }
  return count;
};

export const syncLists = async (userId: string): Promise<number> => {
  // 0. PUSH DELETIONS - handled by syncAll or here if needed
  // await syncDeletions(userId);

  const localLists = await db.lists.toArray();
  let processed = 0;

  for (const list of localLists) {
    if (!list.supabaseId) {
      const { data, error } = await supabase
        .from("lists")
        .insert(toRemoteList(list, userId))
        .select()
        .single();

      if (!error && data) {
        await db.lists.update(list.id!, { supabaseId: data.id });
        processed++;
      }
    } else {
      const { error } = await supabase
        .from("lists")
        .update(toRemoteList(list, userId))
        .eq("id", list.supabaseId);
      if (!error) processed++;
      else logger.error(`Error updating list ${list.name}`, CONTEXT, error);
    }
  }

  const { data: remoteLists, error } = await supabase.from("lists").select("*");
  if (error || !remoteLists) {
    if (error) throw error;
    return processed;
  }

  for (const remote of remoteLists as RemoteList[]) {
    const local = localLists.find((l) => l.supabaseId === remote.id);

    if (!local) {
      await db.lists.put(toLocalList(remote));
      processed++;
    } else {
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = local.updatedAt ? local.updatedAt.getTime() : 0;

      if (remoteTime > localTime) {
        const mapped = toLocalList(remote);
        mapped.id = local.id;
        await db.lists.put(mapped);
        processed++;
      }
    }
  }

  for (const local of localLists) {
    if (
      local.supabaseId &&
      !remoteLists.some((r) => r.id === local.supabaseId)
    ) {
      await db.lists.delete(local.id!);
      processed++;
    }
  }
  return processed;
};

export const syncItems = async (userId: string): Promise<number> => {
  const localItems = await db.items.toArray();
  let processed = 0;

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
        processed++;
      } else {
        logger.error(`Failed to push item ${item.title}`, CONTEXT, error);
      }
    } else {
      const { error } = await supabase
        .from("items")
        .update(payload)
        .eq("id", item.supabaseId);
      if (!error) processed++;
      else logger.error(`Failed to update item ${item.title}`, CONTEXT, error);
    }
  }

  const { data: remoteItems, error } = await supabase.from("items").select("*");
  if (error || !remoteItems) {
    if (error) throw error;
    return processed;
  }

  for (const remote of remoteItems as RemoteItem[]) {
    const local = localItems.find((i) => i.supabaseId === remote.id);
    const mapped = await toLocalItem(remote);

    if (!local) {
      await db.items.put(mapped);
      processed++;
    } else {
      const remoteTime = new Date(remote.updated_at).getTime();
      const localTime = local.updatedAt.getTime();

      if (remoteTime > localTime) {
        mapped.id = local.id;
        await db.items.put(mapped);
        processed++;
      }
    }
  }

  for (const local of localItems) {
    if (
      local.supabaseId &&
      !remoteItems.some((r) => r.id === local.supabaseId)
    ) {
      await db.items.delete(local.id!);
      processed++;
    }
  }
  return processed;
};

export const syncAll = async (): Promise<SyncResult> => {
  const result: SyncResult = {
    success: true,
    timestamp: new Date(),
    processedCount: { lists: 0, items: 0, deletions: 0 },
    errors: [],
  };

  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session?.user) {
    result.success = false;
    result.errors.push({
      context: "auth",
      message: "Пользователь не авторизован",
      originalError: authError,
    });
    return result;
  }

  const userId = session.user.id;

  try {
    logger.info("Starting Sync...", CONTEXT);

    try {
      result.processedCount.deletions = await syncDeletions(userId);
    } catch (err) {
      result.errors.push({
        context: "deletions",
        message: "Ошибка удаления",
        originalError: err,
      });
    }

    try {
      result.processedCount.lists = await syncLists(userId);
    } catch (err) {
      result.errors.push({
        context: "lists",
        message: "Ошибка списков",
        originalError: err,
      });
    }

    try {
      result.processedCount.items = await syncItems(userId);
    } catch (err) {
      result.errors.push({
        context: "items",
        message: "Ошибка элементов",
        originalError: err,
      });
    }

    // 4. Cache Cleanup
    try {
      const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days for sync cleanup
      const now = Date.now();
      await db.cache
        .where("timestamp")
        .below(now - CACHE_TTL)
        .delete();
    } catch (err) {
      logger.warn("Cache cleanup failed", CONTEXT, err);
    }

    result.success = result.errors.length === 0;
    logger.info("Sync Completed", CONTEXT, result.processedCount);
    return result;
  } catch (error) {
    logger.error("Critical Sync Error", CONTEXT, error);
    result.success = false;
    result.errors.push({
      context: "auth",
      message: "Критическая ошибка синхронизации",
      originalError: error,
    });
    return result;
  }
};

// --- MIGRATION LOGIC ---

/**
 * Migrates data from local guest state to user's remote state.
 * @param userId - Supabase user ID
 * @param mode - 'merge' (deduplicate & sync) or 'replace' (start fresh with remote data)
 */
export const migrateGuestData = async (
  userId: string,
  mode: "merge" | "replace",
) => {
  if (mode === "replace") {
    // Simply clear and pull from remote
    await Promise.all([
      db.items.clear(),
      db.lists.clear(),
      db.deleted_metadata.clear(),
    ]);
    return syncAll();
  }

  // --- MERGE MODE: Smart deduplication ---

  // 1. Sync Lists first
  const localLists = await db.lists.toArray();
  const { data: remoteLists } = await supabase
    .from("lists")
    .select("*")
    .eq("user_id", userId);

  for (const local of localLists) {
    // If it has supabaseId, it's already "owned" or synced
    if (local.supabaseId) continue;

    // Check if a remote list with the same name exists
    const match = remoteLists?.find((r) => r.name === local.name);
    if (match) {
      // Link local to remote
      await db.lists.update(local.id!, { supabaseId: match.id });
    } else {
      // Create new remote list
      const { data, error } = await supabase
        .from("lists")
        .insert(toRemoteList(local, userId))
        .select()
        .single();
      if (!error && data) {
        await db.lists.update(local.id!, { supabaseId: data.id });
      }
    }
  }

  // 2. Sync Items with deduplication
  const localItems = await db.items.toArray();
  const { data: remoteItems } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId);

  for (const local of localItems) {
    if (local.supabaseId) continue;

    // Deduplicate by externalId + source
    const match = remoteItems?.find(
      (r) => r.external_id === local.externalId && r.source === local.source,
    );

    if (match) {
      // Link to existing
      await db.items.update(local.id!, { supabaseId: match.id });
    } else {
      // Push new
      const payload = await toRemoteItem(local, userId);
      const { data, error } = await supabase
        .from("items")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        await db.items.update(local.id!, { supabaseId: data.id });
      }
    }
  }

  // Final catch-up sync
  return syncAll();
};

// --- AUTO-SYNC LOGIC ---
let syncTimeout: any = null;

export const triggerAutoSync = () => {
  if (!navigator.onLine) return;

  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    console.log("Triggering auto-sync...");
    await syncAll();
  }, 5000); // 5 second debounce
};
