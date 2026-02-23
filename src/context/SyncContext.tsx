import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { syncAll, migrateGuestData, migrateDroppedStatus, cleanupOldCache } from "../services/dbSync";
import type { SyncStatus, SyncResult } from "../types/sync";
import { logger } from "../utils/logger";
import { db } from "../db/db";
import { MigrationDialog } from "../components/MigrationDialog";
import { vibrate, notificationOccurred } from "../utils/haptics";
import { useToast } from "./ToastContext";

const CONTEXT = "SyncContext";

interface SyncContextType {
  status: SyncStatus;
  lastResult: SyncResult | null;
  triggerSync: () => Promise<SyncResult | null>;
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within SyncProvider");
  return context;
};

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMigration, setShowMigration] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Check if migration was already done (persisted across reloads)
  const [hasCheckedMigration, setHasCheckedMigration] = useState(() => {
    const saved = localStorage.getItem("migration_checked");
    const result = saved === "true";
    logger.info(`[INIT] migration_checked from localStorage: ${saved} → ${result}`, CONTEXT);
    return result;
  });



  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerSync = useCallback(async () => {
    if (!user || !isOnline) return null;

    setStatus("syncing");
    logger.info("[SYNC] Manual sync triggered", CONTEXT);

    try {
      const result = await syncAll();
      setLastResult(result);
      
      if (result.success) {
        // Save sync timestamp
        const now = Date.now();
        localStorage.setItem("last_sync_timestamp", now.toString());
        logger.info(`[SYNC] Sync completed successfully at ${new Date(now).toISOString()}`, CONTEXT);
      }
      
      setStatus(result.success ? "success" : "error");

      // Auto-reset status to idle after 3 seconds if success
      if (result.success) {
        setTimeout(() => setStatus("idle"), 3000);
      }
      return result;
    } catch (error) {
      logger.error("Sync failed in context", CONTEXT, error);
      setStatus("error");
      return null;
    }
  }, [user, isOnline]);

  // Migration Check logic - runs once when user logs in
  useEffect(() => {
    logger.info(`[MIGRATION CHECK] user=${!!user}, hasCheckedMigration=${hasCheckedMigration}`, CONTEXT);
    
    if (user && !hasCheckedMigration) {
      logger.info('[MIGRATION CHECK] Starting migration check...', CONTEXT);
      
      const runFullMigration = async () => {
        try {
          // 1. Migrate dropped status to planned
          await migrateDroppedStatus();

          // 2. Cleanup old cache (older than 30 days)
          await cleanupOldCache();

          // 3. Migrate old image URLs and fix missing types
          const items = await db.items.toArray();
          const updates: Promise<any>[] = [];

          for (const item of items) {
            let needsUpdate = false;
            const updatesObj: Partial<typeof item> = {};

            // Fix missing type based on source
            if (!item.type && item.source) {
              if (item.source === "rawg") {
                updatesObj.type = "game";
                needsUpdate = true;
              } else if (item.source === "google_books") {
                updatesObj.type = "book";
                needsUpdate = true;
              } else if (item.source === "tmdb" || item.source === "kinopoisk") {
                updatesObj.type = item.externalId?.includes("/tv") ? "show" : "movie";
                needsUpdate = true;
              }
            }

            // Migrate old image URLs
            if (item.image && item.image.includes("/api/tmdb-image")) {
              try {
                const url = new URL(item.image, window.location.origin);
                const path = url.searchParams.get("path");
                if (path) {
                  updatesObj.image = `https://wsrv.nl/?url=${encodeURIComponent("https://image.tmdb.org/t/p" + path)}`;
                  needsUpdate = true;
                }
              } catch (e) {
                logger.warn("Failed to parse old image URL", CONTEXT, e);
              }
            }

            // Handle direct tmdb.org URLs without proxy
            if (item.image && item.image.includes("image.tmdb.org") && !item.image.includes("wsrv.nl")) {
              updatesObj.image = `https://wsrv.nl/?url=${encodeURIComponent(item.image)}`;
              needsUpdate = true;
            }

            if (needsUpdate) {
              updatesObj.updatedAt = new Date();
              updates.push(db.items.update(item.id!, updatesObj));
            }
          }

          // @ts-ignore - Dexie PromiseExtended compatibility
          void Promise.all(updates).then(() => {}).catch(() => {});
          logger.info(`Migrated ${updates.length} items with old image URLs or missing types`, CONTEXT);

          // 4. Check if migration dialog is needed
          const guestItems = await db.items.filter((i) => !i.supabaseId).count();
          const guestLists = await db.lists.filter((l) => !l.supabaseId).count();

          logger.info(`[MIGRATION CHECK] Guest items: ${guestItems}, Guest lists: ${guestLists}`, CONTEXT);

          if (guestItems > 0 || guestLists > 0) {
            // Show migration dialog - user needs to choose merge or replace
            logger.info('[MIGRATION CHECK] Showing migration dialog', CONTEXT);
            setGuestCount(guestItems);
            setShowMigration(true);
          } else {
            // No guest data - migration already complete, no need to sync again
            logger.info('[MIGRATION CHECK] Migration already complete - skipping sync', CONTEXT);
          }
        } catch (error) {
          logger.error("Migration check failed", CONTEXT, error);
        } finally {
          // Mark migration check as complete and persist to localStorage
          // This prevents the check from running again on page reload
          logger.info('[MIGRATION CHECK] Setting migration_checked = true', CONTEXT);
          setHasCheckedMigration(true);
          localStorage.setItem("migration_checked", "true");
        }
      };

      runFullMigration();
    } else if (!user) {
      setHasCheckedMigration(false);
      localStorage.removeItem("migration_checked");
    }
  }, [user, hasCheckedMigration]); // Убрал triggerSync из зависимостей

  const handleMigration = async (mode: "merge" | "replace") => {
    setShowMigration(false);
    setLoading(true);
    vibrate("light");
    try {
      if (user) {
        logger.info(`[MIGRATION] Starting migration in ${mode} mode`, CONTEXT);
        await migrateGuestData(user.id, mode);
        
        // Verify migration was successful
        const remainingGuestItems = await db.items.filter((i) => !i.supabaseId).count();
        const remainingGuestLists = await db.lists.filter((l) => !l.supabaseId).count();
        
        if (remainingGuestItems === 0 && remainingGuestLists === 0) {
          logger.info("[MIGRATION] Migration completed successfully - all items synced", CONTEXT);
          notificationOccurred("success");
          setStatus("success");
          showToast("Все данные синхронизированы!", "success");
          
          // Save sync timestamp
          const now = Date.now();
          localStorage.setItem("last_sync_timestamp", now.toString());
          localStorage.setItem("migration_checked", "true");
          setHasCheckedMigration(true);
        } else {
          logger.warn(`[MIGRATION] Incomplete - ${remainingGuestItems} items, ${remainingGuestLists} lists unsynced`, CONTEXT);
          notificationOccurred("warning");
          setStatus("error");
          showToast(`Частичная синхронизация: ${remainingGuestItems} элементов не синхронизировано`, "error");
        }
        
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (error) {
      logger.error("[MIGRATION] Failed", CONTEXT, error);
      notificationOccurred("error");
      vibrate("heavy");
      setStatus("error");
      showToast("Ошибка синхронизации", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SyncContext.Provider value={{ status, lastResult, triggerSync, isOnline }}>
      {children}
      <MigrationDialog
        isOpen={showMigration}
        itemCount={guestCount}
        onMerge={() => handleMigration("merge")}
        onReplace={() => handleMigration("replace")}
        loading={loading}
      />
    </SyncContext.Provider>
  );
};
