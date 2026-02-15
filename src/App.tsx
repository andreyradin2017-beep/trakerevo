import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { Skeleton } from "./components/Skeleton";

// Lazy load pages
const Home = lazy(() =>
  import("./pages/Home").then((module) => ({ default: module.Home })),
);
const Search = lazy(() =>
  import("./pages/Search").then((module) => ({ default: module.Search })),
);
const ItemDetail = lazy(() =>
  import("./pages/ItemDetail").then((module) => ({
    default: module.ItemDetail,
  })),
);
const ListPage = lazy(() =>
  import("./pages/ListPage").then((module) => ({ default: module.ListPage })),
);
const Random = lazy(() =>
  import("./pages/Random").then((module) => ({ default: module.Random })),
);
const Settings = lazy(() =>
  import("./pages/Settings").then((module) => ({ default: module.Settings })),
);
const Archive = lazy(() =>
  import("./pages/Archive").then((module) => ({ default: module.Archive })),
);
const Stats = lazy(() =>
  import("./pages/Stats").then((module) => ({ default: module.Stats })),
);

const PageLoader = () => (
  <div
    style={{
      padding: "1rem",
      display: "flex",
      flexDirection: "column",
      gap: "1rem",
    }}
  >
    <Skeleton width="100%" height={200} borderRadius={16} />
    <Skeleton width="100%" height={100} borderRadius={16} />
    <Skeleton width="100%" height={300} borderRadius={16} />
  </div>
);

function App() {
  return (
    <>
      <OfflineIndicator />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="list/:id" element={<ListPage />} />
            <Route path="item/:id" element={<ItemDetail />} />
            <Route path="random" element={<Random />} />
            <Route path="settings" element={<Settings />} />
            <Route path="archive" element={<Archive />} />
            <Route path="stats" element={<Stats />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
