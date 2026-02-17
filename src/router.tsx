import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@components/Layout";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { PageLoader } from "@components/PageLoader";
import { Suspense, lazy } from "react";

// Lazy load pages
const Home = lazy(() =>
  import("@pages/Home").then((module) => ({ default: module.Home })),
);
const Search = lazy(() =>
  import("@pages/Search").then((module) => ({ default: module.Search })),
);
const ItemDetail = lazy(() =>
  import("@pages/ItemDetail").then((module) => ({
    default: module.ItemDetail,
  })),
);
const ListPage = lazy(() =>
  import("@pages/ListPage").then((module) => ({ default: module.ListPage })),
);
const Random = lazy(() =>
  import("@pages/Random").then((module) => ({ default: module.Random })),
);
const Settings = lazy(() =>
  import("@pages/Settings").then((module) => ({ default: module.Settings })),
);
const Archive = lazy(() =>
  import("@pages/Archive").then((module) => ({ default: module.Archive })),
);
const Discover = lazy(() =>
  import("@pages/Discover").then((module) => ({ default: module.Discover })),
);

// Wrapper for Suspense to avoid repetition
const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

import App from "@/App";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: (
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: (
              <SuspenseWrapper>
                <Home />
              </SuspenseWrapper>
            ),
          },
          {
            path: "search",
            element: (
              <SuspenseWrapper>
                <Search />
              </SuspenseWrapper>
            ),
          },
          {
            path: "list/:id",
            element: (
              <SuspenseWrapper>
                <ListPage />
              </SuspenseWrapper>
            ),
          },
          {
            path: "item/:id",
            element: (
              <SuspenseWrapper>
                <ItemDetail />
              </SuspenseWrapper>
            ),
          },
          {
            path: "random",
            element: (
              <SuspenseWrapper>
                <Random />
              </SuspenseWrapper>
            ),
          },
          {
            path: "settings",
            element: (
              <SuspenseWrapper>
                <Settings />
              </SuspenseWrapper>
            ),
          },
          {
            path: "archive",
            element: (
              <SuspenseWrapper>
                <Archive />
              </SuspenseWrapper>
            ),
          },
          {
            path: "discover",
            element: (
              <SuspenseWrapper>
                <Discover />
              </SuspenseWrapper>
            ),
          },
          {
            path: "*",
            element: <Navigate to="/" replace />,
          },
        ],
      },
    ],
  },
]);
