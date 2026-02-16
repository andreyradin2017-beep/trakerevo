import { OfflineIndicator } from "./components/OfflineIndicator";
import { useSearchProviders } from "./hooks/useSearchProviders";
import { Outlet, ScrollRestoration } from "react-router-dom";

function App() {
  // Initialize search providers on first load
  useSearchProviders();

  return (
    <>
      <OfflineIndicator />
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

export default App;
