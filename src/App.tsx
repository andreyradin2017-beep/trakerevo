import { OfflineIndicator } from "@components/OfflineIndicator";
import { useSearchProviders } from "@hooks/useSearchProviders";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useState, useEffect } from "react";

function App() {
  const [initialized, setInitialized] = useState(false);

  // Initialize search providers on first load
  useSearchProviders();

  useEffect(() => {
    // App initialization complete
    setInitialized(true);
  }, []);

  if (!initialized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "white" }}>
        Загрузка...
      </div>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export default App;
