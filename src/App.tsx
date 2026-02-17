import { useState, useEffect } from "react";
import { OfflineIndicator } from "@components/OfflineIndicator";
import { useSearchProviders } from "@hooks/useSearchProviders";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { db } from "./db/db";
import { MigrationDialog } from "@components/MigrationDialog";
import { migrateGuestData } from "./services/dbSync";
import { vibrate, notificationOccurred } from "./utils/haptics";

function App() {
  const { user } = useAuth();
  const [showMigration, setShowMigration] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize search providers on first load
  useSearchProviders();

  useEffect(() => {
    const checkMigrationNeeded = async () => {
      if (!user) {
        setShowMigration(false);
        return;
      }

      // Check for items OR lists that don't have a supabaseId (meaning they are guest data)
      // Dexie doesn't index undefined well, so we might need to filter manually or check if field is missing.
      const allItems = await db.items.toArray();
      const itemsToMigrate = allItems.filter((i) => !i.supabaseId);

      const allLists = await db.lists.toArray();
      const listsToMigrate = allLists.filter((l) => !l.supabaseId);

      if (itemsToMigrate.length > 0 || listsToMigrate.length > 0) {
        setGuestCount(itemsToMigrate.length);
        setShowMigration(true);
      }
    };

    checkMigrationNeeded();
  }, [user]);

  const handleMigration = async (mode: "merge" | "replace") => {
    if (!user) return;
    setLoading(true);
    vibrate("light");
    try {
      await migrateGuestData(user.id, mode);
      setShowMigration(false);
      notificationOccurred("success");
    } catch (err) {
      console.error("Migration failed:", err);
      notificationOccurred("error");
      vibrate("heavy");
      // Close the dialog even on error to prevent "stuck" UI,
      // the user can try again or check logs if needed.
      setShowMigration(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <OfflineIndicator />
      <ScrollRestoration />
      <Outlet />

      <MigrationDialog
        isOpen={showMigration}
        itemCount={guestCount}
        onMerge={() => handleMigration("merge")}
        onReplace={() => handleMigration("replace")}
        loading={loading}
      />
    </>
  );
}

export default App;
