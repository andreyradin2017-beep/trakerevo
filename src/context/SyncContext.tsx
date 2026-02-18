import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "./AuthContext";
import { syncAll } from "../services/dbSync";
import type { SyncStatus, SyncResult } from "../types/sync";
import { logger } from "../utils/logger";
import { db } from "../db/db";
import { migrateGuestData } from "../services/dbSync";
import { MigrationModal } from "../components/MigrationModal";

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
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showMigration, setShowMigration] = useState(false);
  const [hasCheckedMigration, setHasCheckedMigration] = useState(false);

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
    logger.debug("Manual sync triggered", CONTEXT);

    try {
      const result = await syncAll();
      setLastResult(result);
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

  // Migration Check logic
  useEffect(() => {
    if (user && !hasCheckedMigration) {
      const checkLocalData = async () => {
        // If we have local items/lists without supabaseId, it means they are guest data
        const guestItems = await db.items.filter((i) => !i.supabaseId).count();
        const guestLists = await db.lists.filter((l) => !l.supabaseId).count();

        if (guestItems > 0 || guestLists > 0) {
          setShowMigration(true);
        } else {
          // No guest data, just sync normally
          triggerSync();
        }
        setHasCheckedMigration(true);
      };
      checkLocalData();
    } else if (!user) {
      setHasCheckedMigration(false);
    }
  }, [user, hasCheckedMigration, triggerSync]);

  const handleMigration = async (mode: "merge" | "replace") => {
    setShowMigration(false);
    setStatus("syncing");
    try {
      if (user) {
        await migrateGuestData(user.id, mode);
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (error) {
      logger.error("Migration failed", CONTEXT, error);
      setStatus("error");
    }
  };

  return (
    <SyncContext.Provider value={{ status, lastResult, triggerSync, isOnline }}>
      {children}
      <MigrationModal
        isOpen={showMigration}
        onMerge={() => handleMigration("merge")}
        onReplace={() => handleMigration("replace")}
        onClose={() => {
          setShowMigration(false);
          triggerSync(); // Fallback to normal sync
        }}
      />
    </SyncContext.Provider>
  );
};
