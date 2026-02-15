import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { syncAll } from "../services/dbSync";
import { useAuth } from "./AuthContext";

type SyncStatus = "idle" | "syncing" | "success" | "error";

interface SyncContextType {
  status: SyncStatus;
  lastSyncTime: Date | null;
  error: string | null;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = useCallback(async () => {
    if (!user) return;

    setStatus("syncing");
    setError(null);

    try {
      const result = await syncAll();

      if (result.success) {
        setStatus("success");
        setLastSyncTime(new Date());
        // Auto-reset to idle after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setError(result.errors.join(", "));
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [user]);

  // Auto-sync on login
  useEffect(() => {
    if (user) {
      console.log("User logged in, triggering auto-sync...");
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => triggerSync(), 0);
    }
  }, [user, triggerSync]);

  // Background sync on visibility change
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Debounce: only sync if last sync was more than 5 minutes ago
        const fiveMinutesAgo = Date.now() - 300000;
        if (!lastSyncTime || lastSyncTime.getTime() < fiveMinutesAgo) {
          console.log("App became visible, triggering background sync...");
          triggerSync();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user, lastSyncTime, triggerSync]);

  return (
    <SyncContext.Provider value={{ status, lastSyncTime, error, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within SyncProvider");
  }
  return context;
};
